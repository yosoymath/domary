import { AddressManager } from "@/components/account/address-manager";
import { ProfileForm } from "@/components/account/profile-form";
import { SecurityForm } from "@/components/account/security-form";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { formatDate } from "@/lib/formatters";
import { prisma } from "@/lib/prisma";

export default async function ProfilePage() {
  const user = await requireCurrentUser("/account/profile");
  const today = new Date().toISOString().slice(0, 10);
  const addresses = await prisma.customerAddress.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      label: true,
      postalCode: true,
      street: true,
      number: true,
      complement: true,
      district: true,
      city: true,
      state: true,
      isPrimary: true,
    },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
  });

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-black/8 bg-white p-5 sm:p-8">
        <p className="text-xs font-black tracking-wider text-black/40 uppercase">Dados pessoais</p>
        <h2 className="mt-2 text-3xl font-black">Meu perfil</h2>
        <p className="mt-2 text-sm text-black/50">Atualize as informações usadas no atendimento e nas entregas.</p>
        <div className="mt-8">
          <ProfileForm
            birthDate={user.birthDate?.toISOString().slice(0, 10) ?? ""}
            cpf={user.cpf}
            email={user.email}
            gender={user.gender}
            name={user.name}
            phone={user.phone}
            today={today}
          />
        </div>
      </div>

      <section className="rounded-[2rem] border border-black/8 bg-white p-5 sm:p-8" id="enderecos">
        <p className="text-xs font-black tracking-wider text-black/40 uppercase">Endereços</p>
        <h2 className="mt-2 text-3xl font-black">Locais de entrega</h2>
        <p className="mt-2 text-sm text-black/50">Cadastre mais de um endereço e escolha qual deles deve ser o principal.</p>
        <div className="mt-8"><AddressManager addresses={addresses} /></div>
      </section>

      <section className="rounded-[2rem] border border-black/8 bg-white p-5 sm:p-8" id="seguranca">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div><p className="text-xs font-black tracking-wider text-black/40 uppercase">Segurança</p><h2 className="mt-2 text-3xl font-black">Alterar senha</h2><p className="mt-2 text-sm text-black/50">Confirme sua senha atual antes de definir uma nova.</p></div>
          <div className="shrink-0 rounded-2xl bg-black/[0.03] px-4 py-3 text-xs text-black/50"><strong className="block font-black text-black/70">Cliente desde</strong>{formatDate(user.createdAt)}</div>
        </div>
        <div className="mt-8"><SecurityForm /></div>
        <p className="mt-5 border-t border-black/8 pt-5 text-xs leading-5 text-black/40">Sua senha é armazenada somente como hash bcrypt e nunca pode ser consultada em texto puro.</p>
      </section>
    </div>
  );
}
