import { env } from "@/lib/env";

type BlogPostShareInput = {
  title: string;
  excerpt?: string | null;
  slug: string;
  category: string;
  heroImage?: string | null;
  tags?: unknown;
};

type LinkedInShareResult =
  | { status: "skipped"; reason: string }
  | { status: "posted"; postUrn?: string }
  | { status: "failed"; reason: string };

function resolveSiteUrl(): string {
  return env.siteUrl.replace(/\/+$/, "");
}

function resolveAbsoluteUrl(value: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  const normalized = value.startsWith("/") ? value : `/${value}`;
  return `${resolveSiteUrl()}${normalized}`;
}

function extractTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  return tags
    .filter((tag): tag is string => typeof tag === "string")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 5);
}

function buildShareText(input: BlogPostShareInput): string {
  const url = resolveAbsoluteUrl(`/perspectives/${input.slug}`);
  const pieces = [
    input.title,
    input.excerpt?.trim() || `New perspective from Eccellere on ${input.category.toLowerCase()}.`,
    url,
    ...extractTags(input.tags).map((tag) => `#${tag.replace(/\s+/g, "")}`),
    "#Eccellere",
    "#MSME",
  ];

  return pieces.filter(Boolean).join("\n\n").slice(0, 2900);
}

async function uploadImageToLinkedIn(authorUrn: string, accessToken: string, imageUrl: string): Promise<string> {
  const registerResponse = await fetch("https://api.linkedin.com/v2/assets?action=registerUpload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      registerUploadRequest: {
        recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
        owner: authorUrn,
        serviceRelationships: [
          {
            relationshipType: "OWNER",
            identifier: "urn:li:userGeneratedContent",
          },
        ],
      },
    }),
  });

  if (!registerResponse.ok) {
    throw new Error(`LinkedIn upload registration failed (${registerResponse.status})`);
  }

  const registerData = await registerResponse.json();
  const uploadUrl =
    registerData?.value?.uploadMechanism?.["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"]?.uploadUrl;
  const assetUrn = registerData?.value?.asset as string | undefined;

  if (!uploadUrl || !assetUrn) {
    throw new Error("LinkedIn upload registration returned an invalid payload");
  }

  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error(`Could not fetch hero image (${imageResponse.status})`);
  }

  const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
  const contentType = imageResponse.headers.get("content-type") || "application/octet-stream";

  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
    },
    body: imageBuffer,
  });

  if (!uploadResponse.ok) {
    throw new Error(`LinkedIn image upload failed (${uploadResponse.status})`);
  }

  return assetUrn;
}

export async function shareBlogPostToLinkedIn(input: BlogPostShareInput): Promise<LinkedInShareResult> {
  const accessToken = env.linkedinAccessToken;
  const authorUrn = env.linkedinAuthorUrn;

  if (!accessToken || !authorUrn) {
    return {
      status: "skipped",
      reason: "LinkedIn credentials are not configured.",
    };
  }

  if (!input.heroImage) {
    return {
      status: "failed",
      reason: "A hero image is required to publish this post to LinkedIn.",
    };
  }

  const imageUrl = resolveAbsoluteUrl(input.heroImage);
  const shareText = buildShareText(input);

  try {
    const imageUrn = await uploadImageToLinkedIn(authorUrn, accessToken, imageUrl);

    const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({
        author: authorUrn,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: {
              text: shareText,
            },
            shareMediaCategory: "IMAGE",
            media: [
              {
                status: "READY",
                media: imageUrn,
                title: {
                  text: input.title,
                },
              },
            ],
          },
        },
        visibility: {
          "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`LinkedIn post failed (${response.status}): ${text}`);
    }

    return {
      status: "posted",
      postUrn: response.headers.get("x-restli-id") || response.headers.get("location") || undefined,
    };
  } catch (error) {
    return {
      status: "failed",
      reason: error instanceof Error ? error.message : "Unknown LinkedIn publishing error.",
    };
  }
}