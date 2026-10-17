import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { US_STATES } from "@/lib/address";
import Shell from "../Shell";
import CheckoutForm from "../CheckoutForm";

export default async function Checkout() {
  const session = await auth();
  const user = session?.user?.id
    ? await prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true, name: true } })
    : null;
  return (
    <Shell cta="Keep shopping" href="/#shop">
      <section className="shop-page">
        <span className="badge">Checkout</span>
        <h1>Almost your first scoop</h1>
        <p className="hand note">Two minutes, then it ships.</p>
        <CheckoutForm
          states={US_STATES}
          defaultEmail={user?.email}
          defaultName={user?.name ?? undefined}
          signedIn={Boolean(user)}
        />
      </section>
    </Shell>
  );
}
