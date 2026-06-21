import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Mail, Clock3, Building2, User, MessageSquare, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = new Set(["SUPER_ADMIN", "ADMIN", "CONTENT_ADMIN"]);

function fmtDate(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

export default async function ContactEnquiriesPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session || !role || !ADMIN_ROLES.has(role)) {
    redirect("/login");
  }

  const enquiries = await prisma.contactSubmission.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const newCount = enquiries.filter((item) => item.status === "new").length;
  const totalCount = enquiries.length;

  return (
    <main className="min-h-screen bg-eccellere-cream px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 rounded-lg bg-white p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold">
              <Mail className="h-3.5 w-3.5" />
              Contact Enquiries
            </div>
            <h1 className="mt-2 font-display text-3xl font-light text-eccellere-ink">
              Website enquiries inbox
            </h1>
            <p className="mt-1 text-sm text-ink-light">
              Every form submission is stored in the database and also forwarded to the admin email inbox when SMTP is configured.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="rounded-lg bg-eccellere-cream px-4 py-3 text-sm">
              <div className="text-xs uppercase tracking-wider text-ink-light">Total</div>
              <div className="mt-1 font-mono text-xl text-eccellere-ink">{totalCount}</div>
            </div>
            <div className="rounded-lg bg-eccellere-gold/10 px-4 py-3 text-sm">
              <div className="text-xs uppercase tracking-wider text-ink-light">New</div>
              <div className="mt-1 font-mono text-xl text-eccellere-ink">{newCount}</div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
          <div className="border-b border-eccellere-ink/5 px-6 py-4">
            <h2 className="text-sm font-medium text-eccellere-ink">Recent submissions</h2>
          </div>

          {enquiries.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm text-ink-light">
              No enquiries received yet.
            </div>
          ) : (
            <div className="divide-y divide-eccellere-ink/5">
              {enquiries.map((item) => (
                <div key={item.id} className="px-6 py-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-sm bg-eccellere-gold/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-eccellere-gold">
                          {item.status}
                        </span>
                        <span className="rounded-sm bg-eccellere-ink/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-ink-light">
                          {item.inquiryType.replace(/-/g, " ")}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-base font-medium text-eccellere-ink">{item.name}</h3>
                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-light">
                          <span className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5" />
                            {item.email}
                          </span>
                          {item.phone && (
                            <span className="flex items-center gap-1.5">
                              <Clock3 className="h-3.5 w-3.5" />
                              {item.phone}
                            </span>
                          )}
                          {item.company && (
                            <span className="flex items-center gap-1.5">
                              <Building2 className="h-3.5 w-3.5" />
                              {item.company}
                            </span>
                          )}
                          {item.sector && <span>{item.sector}</span>}
                        </div>
                      </div>

                      <p className="max-w-4xl whitespace-pre-wrap text-sm leading-relaxed text-eccellere-ink/85">
                        {item.message}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-col gap-2 text-sm lg:items-end">
                      <div className="flex items-center gap-1.5 text-xs text-ink-light">
                        <MessageSquare className="h-3.5 w-3.5" />
                        Received {fmtDate(item.createdAt)}
                      </div>
                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        <Button asChild size="sm" variant="outline" className="gap-1.5 text-xs">
                          <Link href={`mailto:${item.email}`}>
                            Reply <ArrowUpRight className="h-3 w-3" />
                          </Link>
                        </Button>
                        <Button asChild size="sm" variant="ghost" className="text-xs text-eccellere-gold hover:bg-eccellere-gold/10">
                          <Link href="/admin">Back to dashboard</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}