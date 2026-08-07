import { ProfileForm } from "@/components/account/profile-form";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { formatDate } from "@/lib/formatters";

export default async function ProfilePage() {
  const user = await requireCurrentUser("/account/profile");

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-black/8 bg-white p-5 sm:p-8">
        <p className="text-xs font-black tracking-wider text-black/40 uppercase">Dados pessoais</p>
        <h2 className="mt-2 text-3xl font-black">Meu perfil</h2>
        <p className="mt-2 text-sm text-black/50">Atualize as informações usadas no atendimento e nas entregas.</p>
        <div className="mt-8"><ProfileForm email={user.email} name={user.name} phone={user.phone} /></div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border border-black/8 bg-white p-5"><p className="text-xs font-black tracking-wider text-black/40 uppercase">Segurança</p><h3 className="mt-2 font-black">Senha protegida</h3><p className="mt-2 text-sm leading-6 text-black/50">Sua senha é armazenada somente como hash bcrypt e nunca pode ser consultada em texto puro.</p></div>
        <div className="rounded-3xl border border-black/8 bg-white p-5"><p className="text-xs font-black tracking-wider text-black/40 uppercase">Cliente desde</p><h3 className="mt-2 font-black">{formatDate(user.createdAt)}</h3><p className="mt-2 text-sm leading-6 text-black/50">Conta ativa com acesso ao histórico de pedidos e favoritos.</p></div>
      </div>
    </div>
  );
}
