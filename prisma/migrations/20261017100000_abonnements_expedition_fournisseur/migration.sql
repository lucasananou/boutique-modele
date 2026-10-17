-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "forwardedAt" TIMESTAMP(3),
ADD COLUMN     "fulfillmentRef" TEXT,
ADD COLUMN     "kind" TEXT NOT NULL DEFAULT 'one_time',
ADD COLUMN     "shippingAmount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "shippingLine2" TEXT,
ADD COLUMN     "shippingPhone" TEXT,
ADD COLUMN     "shippingState" TEXT,
ADD COLUMN     "stripeCustomerId" TEXT,
ADD COLUMN     "stripeInvoiceId" TEXT,
ADD COLUMN     "subscriptionId" TEXT;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "intervalDays" INTEGER,
ADD COLUMN     "units" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "ProductVariant" ADD COLUMN     "units" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'incomplete',
    "productId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "variantId" TEXT,
    "variantLabel" TEXT,
    "units" INTEGER NOT NULL DEFAULT 1,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "intervalDays" INTEGER NOT NULL,
    "unitAmount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "locale" TEXT NOT NULL DEFAULT 'en',
    "stripeSubscriptionId" TEXT,
    "stripeCustomerId" TEXT,
    "nextChargeAt" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "canceledAt" TIMESTAMP(3),
    "manageToken" TEXT NOT NULL,
    "shippingName" TEXT,
    "shippingLine1" TEXT,
    "shippingLine2" TEXT,
    "shippingCity" TEXT,
    "shippingState" TEXT,
    "shippingZip" TEXT,
    "shippingCountry" TEXT,
    "shippingPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_manageToken_key" ON "Subscription"("manageToken");

-- CreateIndex
CREATE INDEX "Subscription_email_idx" ON "Subscription"("email");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Order_stripeInvoiceId_key" ON "Order"("stripeInvoiceId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

