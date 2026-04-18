-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `passwordHash` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `role` ENUM('CLIENT', 'SPECIALIST', 'ADMIN', 'SUPER_ADMIN', 'CONTENT_ADMIN', 'MARKETPLACE_ADMIN', 'CRM_ADMIN', 'FINANCE_ADMIN') NOT NULL DEFAULT 'CLIENT',
    `avatar` VARCHAR(191) NULL,
    `emailVerified` BOOLEAN NOT NULL DEFAULT false,
    `phoneVerified` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `lastLoginAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    UNIQUE INDEX `User_phone_key`(`phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ClientProfile` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `companyName` VARCHAR(191) NOT NULL,
    `gstin` VARCHAR(191) NULL,
    `gstinVerified` BOOLEAN NOT NULL DEFAULT false,
    `businessType` VARCHAR(191) NOT NULL,
    `sector` VARCHAR(191) NOT NULL,
    `subSector` VARCHAR(191) NULL,
    `revenueRange` VARCHAR(191) NOT NULL,
    `employeeRange` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NOT NULL,
    `state` VARCHAR(191) NOT NULL,
    `yearsInBusiness` INTEGER NULL,
    `challenges` JSON NOT NULL,
    `priorities` JSON NOT NULL,
    `consultingExperience` VARCHAR(191) NULL,
    `preferredLanguage` VARCHAR(191) NOT NULL DEFAULT 'en',
    `commChannel` VARCHAR(191) NOT NULL DEFAULT 'email',
    `referralSource` VARCHAR(191) NULL,
    `onboardingComplete` BOOLEAN NOT NULL DEFAULT false,
    `diagnosticResults` JSON NULL,
    `leadScore` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ClientProfile_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TeamMember` (
    `id` VARCHAR(191) NOT NULL,
    `clientProfileId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL,
    `addedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SpecialistProfile` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `headline` VARCHAR(191) NULL,
    `bio` VARCHAR(191) NULL,
    `linkedinUrl` VARCHAR(191) NOT NULL,
    `currentRole` VARCHAR(191) NOT NULL,
    `organisation` VARCHAR(191) NULL,
    `experienceYears` VARCHAR(191) NOT NULL,
    `education` JSON NOT NULL,
    `certifications` JSON NOT NULL,
    `serviceDomains` JSON NOT NULL,
    `sectorExpertise` JSON NOT NULL,
    `challengesAddressed` JSON NOT NULL,
    `languages` JSON NOT NULL,
    `engagementTypes` JSON NOT NULL,
    `hourlyRateMin` INTEGER NULL,
    `hourlyRateMax` INTEGER NULL,
    `availability` VARCHAR(191) NOT NULL,
    `monthlyHoursAvail` INTEGER NULL,
    `portfolioFiles` JSON NOT NULL,
    `videoIntroUrl` VARCHAR(191) NULL,
    `status` ENUM('APPLIED', 'UNDER_REVIEW', 'REVISIONS_REQUESTED', 'APPROVED', 'ACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'APPLIED',
    `approvedAt` DATETIME(3) NULL,
    `approvedBy` VARCHAR(191) NULL,
    `rejectionReason` VARCHAR(191) NULL,
    `averageRating` DOUBLE NULL DEFAULT 0,
    `totalAssignments` INTEGER NOT NULL DEFAULT 0,
    `totalEarnings` INTEGER NOT NULL DEFAULT 0,
    `revenueSharePct` INTEGER NOT NULL DEFAULT 60,
    `bankAccountNumber` VARCHAR(191) NULL,
    `bankIfsc` VARCHAR(191) NULL,
    `bankAccountHolder` VARCHAR(191) NULL,
    `bankVerified` BOOLEAN NOT NULL DEFAULT false,
    `upiId` VARCHAR(191) NULL,
    `panNumber` VARCHAR(191) NULL,
    `panVerified` BOOLEAN NOT NULL DEFAULT false,
    `gstNumber` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SpecialistProfile_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Asset` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `category` ENUM('AI_TOOLKIT', 'STRATEGY_FRAMEWORK', 'OPERATIONS_TEMPLATE', 'MSME_GROWTH_KIT', 'FINANCIAL_MODEL', 'HR_PEOPLE', 'CONSULTING_ENGAGEMENT', 'WEBINAR', 'PLAYBOOK', 'DIAGNOSTIC', 'CALCULATOR', 'CASE_STUDY') NOT NULL,
    `serviceDomain` VARCHAR(191) NOT NULL,
    `targetSectors` JSON NOT NULL,
    `complexityLevel` VARCHAR(191) NOT NULL,
    `tags` JSON NOT NULL,
    `targetAudience` VARCHAR(191) NULL,
    `timeToComplete` VARCHAR(191) NULL,
    `language` VARCHAR(191) NOT NULL DEFAULT 'en',
    `price` INTEGER NOT NULL,
    `memberPrice` INTEGER NULL,
    `components` JSON NOT NULL,
    `fileUrls` JSON NOT NULL,
    `previewImages` JSON NOT NULL,
    `previewUrl` VARCHAR(191) NULL,
    `version` VARCHAR(191) NOT NULL DEFAULT '1.0',
    `status` ENUM('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'REVISIONS_REQUESTED', 'APPROVED', 'PUBLISHED', 'RETIRED') NOT NULL DEFAULT 'DRAFT',
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `licenceType` VARCHAR(191) NOT NULL DEFAULT 'single-use',
    `exclusivity` VARCHAR(191) NOT NULL DEFAULT 'exclusive',
    `authorId` VARCHAR(191) NOT NULL,
    `reviewNotes` VARCHAR(191) NULL,
    `reviewedBy` VARCHAR(191) NULL,
    `averageRating` DOUBLE NULL DEFAULT 0,
    `totalPurchases` INTEGER NOT NULL DEFAULT 0,
    `totalViews` INTEGER NOT NULL DEFAULT 0,
    `totalRevenue` INTEGER NOT NULL DEFAULT 0,
    `refundRate` DOUBLE NULL DEFAULT 0,
    `publishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Asset_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FrameworkAccess` (
    `id` VARCHAR(191) NOT NULL,
    `clientProfileId` VARCHAR(191) NOT NULL,
    `assetId` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'not_started',
    `progress` JSON NULL,
    `notes` TEXT NULL,
    `downloadCount` INTEGER NOT NULL DEFAULT 0,
    `lastAccessedAt` DATETIME(3) NULL,
    `grantedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CartItem` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `assetId` VARCHAR(191) NOT NULL,
    `addedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `CartItem_userId_assetId_key`(`userId`, `assetId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Order` (
    `id` VARCHAR(191) NOT NULL,
    `orderNumber` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `subtotal` INTEGER NOT NULL,
    `gstAmount` INTEGER NOT NULL,
    `discountAmount` INTEGER NOT NULL DEFAULT 0,
    `totalAmount` INTEGER NOT NULL,
    `couponCode` VARCHAR(191) NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'INR',
    `status` ENUM('PENDING', 'PAID', 'FAILED', 'REFUND_REQUESTED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `paymentGateway` VARCHAR(191) NULL,
    `gatewayOrderId` VARCHAR(191) NULL,
    `gatewayPaymentId` VARCHAR(191) NULL,
    `paymentMethod` VARCHAR(191) NULL,
    `invoiceNumber` VARCHAR(191) NULL,
    `invoiceUrl` VARCHAR(191) NULL,
    `billingName` VARCHAR(191) NULL,
    `billingGstin` VARCHAR(191) NULL,
    `billingAddress` JSON NULL,
    `refundReason` VARCHAR(191) NULL,
    `refundedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Order_orderNumber_key`(`orderNumber`),
    UNIQUE INDEX `Order_invoiceNumber_key`(`invoiceNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrderItem` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `assetId` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `unitPrice` INTEGER NOT NULL,
    `totalPrice` INTEGER NOT NULL,
    `downloaded` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Subscription` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `planId` VARCHAR(191) NOT NULL,
    `status` ENUM('ACTIVE', 'PAUSED', 'PAST_DUE', 'CANCELLED', 'EXPIRED') NOT NULL DEFAULT 'ACTIVE',
    `gatewaySubId` VARCHAR(191) NULL,
    `currentPeriodStart` DATETIME(3) NOT NULL,
    `currentPeriodEnd` DATETIME(3) NOT NULL,
    `cancelledAt` DATETIME(3) NULL,
    `cancelReason` VARCHAR(191) NULL,
    `autoRenew` BOOLEAN NOT NULL DEFAULT true,
    `retryCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SubscriptionPlan` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `priceMonthly` INTEGER NOT NULL,
    `priceAnnual` INTEGER NOT NULL,
    `features` JSON NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `SubscriptionPlan_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Assignment` (
    `id` VARCHAR(191) NOT NULL,
    `clientProfileId` VARCHAR(191) NOT NULL,
    `specialistProfileId` VARCHAR(191) NULL,
    `title` VARCHAR(191) NOT NULL,
    `brief` TEXT NOT NULL,
    `sector` VARCHAR(191) NOT NULL,
    `serviceDomain` VARCHAR(191) NOT NULL,
    `deliverables` JSON NOT NULL,
    `status` ENUM('REQUESTED', 'MATCHED', 'ACCEPTED', 'IN_PROGRESS', 'DELIVERED', 'UNDER_REVIEW', 'COMPLETED', 'CANCELLED', 'DISPUTED') NOT NULL DEFAULT 'REQUESTED',
    `estimatedHours` INTEGER NULL,
    `agreedFee` INTEGER NULL,
    `feeType` VARCHAR(191) NULL,
    `startDate` DATETIME(3) NULL,
    `dueDate` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `files` JSON NOT NULL,
    `completionReport` JSON NULL,
    `clientRating` INTEGER NULL,
    `clientReview` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AssignmentMilestone` (
    `id` VARCHAR(191) NOT NULL,
    `assignmentId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `dueDate` DATETIME(3) NULL,
    `isCompleted` BOOLEAN NOT NULL DEFAULT false,
    `completedAt` DATETIME(3) NULL,
    `paymentAmount` INTEGER NULL,
    `sortOrder` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AssignmentMessage` (
    `id` VARCHAR(191) NOT NULL,
    `assignmentId` VARCHAR(191) NOT NULL,
    `senderId` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `attachments` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Payout` (
    `id` VARCHAR(191) NOT NULL,
    `specialistProfileId` VARCHAR(191) NOT NULL,
    `grossAmount` INTEGER NOT NULL,
    `platformFee` INTEGER NOT NULL,
    `tdsAmount` INTEGER NOT NULL,
    `netAmount` INTEGER NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `sourceType` VARCHAR(191) NOT NULL,
    `sourceIds` JSON NOT NULL,
    `status` ENUM('SCHEDULED', 'PROCESSING', 'PROCESSED', 'FAILED', 'ON_HOLD', 'DISPUTED') NOT NULL DEFAULT 'SCHEDULED',
    `scheduledDate` DATETIME(3) NOT NULL,
    `processedAt` DATETIME(3) NULL,
    `transactionId` VARCHAR(191) NULL,
    `bankReference` VARCHAR(191) NULL,
    `failureReason` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChatSession` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `title` VARCHAR(191) NULL,
    `summary` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `metadata` JSON NULL,
    `sector` VARCHAR(191) NULL,
    `satisfaction` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChatMessage` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `metadata` JSON NULL,
    `feedback` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Assessment` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `sector` VARCHAR(191) NOT NULL,
    `companySize` VARCHAR(191) NULL,
    `responses` JSON NOT NULL,
    `totalScore` INTEGER NOT NULL,
    `maxScore` INTEGER NOT NULL DEFAULT 150,
    `maturityLevel` INTEGER NOT NULL,
    `dimensionScores` JSON NOT NULL,
    `recommendations` JSON NOT NULL,
    `reportUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AssetReview` (
    `id` VARCHAR(191) NOT NULL,
    `assetId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `rating` INTEGER NOT NULL,
    `review` TEXT NULL,
    `isVerified` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `AssetReview_assetId_userId_key`(`assetId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SpecialistReview` (
    `id` VARCHAR(191) NOT NULL,
    `specialistProfileId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `assignmentId` VARCHAR(191) NULL,
    `rating` INTEGER NOT NULL,
    `review` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notification` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `actionUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `action` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `details` JSON NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Coupon` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `discountType` VARCHAR(191) NOT NULL,
    `discountValue` INTEGER NOT NULL,
    `maxUses` INTEGER NULL,
    `usedCount` INTEGER NOT NULL DEFAULT 0,
    `minOrderAmount` INTEGER NULL,
    `applicableCategories` JSON NOT NULL,
    `applicableSectors` JSON NOT NULL,
    `validFrom` DATETIME(3) NOT NULL,
    `validUntil` DATETIME(3) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Coupon_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Session` (
    `id` VARCHAR(191) NOT NULL,
    `sessionToken` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `expires` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Session_sessionToken_key`(`sessionToken`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Testimonial` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `company` VARCHAR(191) NOT NULL,
    `sector` VARCHAR(191) NOT NULL,
    `quote` TEXT NOT NULL,
    `photoUrl` VARCHAR(191) NULL,
    `linkedinUrl` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CaseStudy` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `sector` VARCHAR(191) NOT NULL,
    `service` VARCHAR(191) NOT NULL,
    `challenge` TEXT NOT NULL,
    `approach` TEXT NOT NULL,
    `outcomes` TEXT NOT NULL,
    `metrics` JSON NOT NULL,
    `clientQuote` TEXT NULL,
    `clientName` VARCHAR(191) NULL,
    `clientTitle` VARCHAR(191) NULL,
    `heroImage` VARCHAR(191) NULL,
    `isPublished` BOOLEAN NOT NULL DEFAULT false,
    `publishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CaseStudy_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BlogPost` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `excerpt` VARCHAR(191) NULL,
    `content` TEXT NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `tags` JSON NOT NULL,
    `authorName` VARCHAR(191) NOT NULL,
    `authorAvatar` VARCHAR(191) NULL,
    `authorBio` VARCHAR(191) NULL,
    `heroImage` VARCHAR(191) NULL,
    `ogImage` VARCHAR(191) NULL,
    `metaTitle` VARCHAR(191) NULL,
    `metaDescription` VARCHAR(191) NULL,
    `primaryKeyword` VARCHAR(191) NULL,
    `readingTime` INTEGER NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'draft',
    `publishedAt` DATETIME(3) NULL,
    `scheduledAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `BlogPost_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ContactSubmission` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `company` VARCHAR(191) NULL,
    `sector` VARCHAR(191) NULL,
    `inquiryType` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'new',
    `assignedTo` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NewsletterSubscriber` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `subscribedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `unsubscribedAt` DATETIME(3) NULL,

    UNIQUE INDEX `NewsletterSubscriber_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ClientProfile` ADD CONSTRAINT `ClientProfile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeamMember` ADD CONSTRAINT `TeamMember_clientProfileId_fkey` FOREIGN KEY (`clientProfileId`) REFERENCES `ClientProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SpecialistProfile` ADD CONSTRAINT `SpecialistProfile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Asset` ADD CONSTRAINT `Asset_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `SpecialistProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FrameworkAccess` ADD CONSTRAINT `FrameworkAccess_clientProfileId_fkey` FOREIGN KEY (`clientProfileId`) REFERENCES `ClientProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FrameworkAccess` ADD CONSTRAINT `FrameworkAccess_assetId_fkey` FOREIGN KEY (`assetId`) REFERENCES `Asset`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CartItem` ADD CONSTRAINT `CartItem_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CartItem` ADD CONSTRAINT `CartItem_assetId_fkey` FOREIGN KEY (`assetId`) REFERENCES `Asset`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_assetId_fkey` FOREIGN KEY (`assetId`) REFERENCES `Asset`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Subscription` ADD CONSTRAINT `Subscription_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Subscription` ADD CONSTRAINT `Subscription_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `SubscriptionPlan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Assignment` ADD CONSTRAINT `Assignment_clientProfileId_fkey` FOREIGN KEY (`clientProfileId`) REFERENCES `ClientProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Assignment` ADD CONSTRAINT `Assignment_specialistProfileId_fkey` FOREIGN KEY (`specialistProfileId`) REFERENCES `SpecialistProfile`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AssignmentMilestone` ADD CONSTRAINT `AssignmentMilestone_assignmentId_fkey` FOREIGN KEY (`assignmentId`) REFERENCES `Assignment`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AssignmentMessage` ADD CONSTRAINT `AssignmentMessage_assignmentId_fkey` FOREIGN KEY (`assignmentId`) REFERENCES `Assignment`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payout` ADD CONSTRAINT `Payout_specialistProfileId_fkey` FOREIGN KEY (`specialistProfileId`) REFERENCES `SpecialistProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatSession` ADD CONSTRAINT `ChatSession_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatMessage` ADD CONSTRAINT `ChatMessage_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `ChatSession`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Assessment` ADD CONSTRAINT `Assessment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AssetReview` ADD CONSTRAINT `AssetReview_assetId_fkey` FOREIGN KEY (`assetId`) REFERENCES `Asset`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SpecialistReview` ADD CONSTRAINT `SpecialistReview_specialistProfileId_fkey` FOREIGN KEY (`specialistProfileId`) REFERENCES `SpecialistProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Session` ADD CONSTRAINT `Session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
