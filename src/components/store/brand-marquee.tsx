import styles from "./brand-marquee.module.css";

type Brand = {
  name: string;
  detail?: string;
  provisional?: boolean;
};

const brands: readonly Brand[] = [
  { name: "Dudalina" },
  { name: "Individual" },
  { name: "Acostamento" },
  { name: "Hering" },
  { name: "Pit Bull", detail: "Jeans" },
  { name: "Pit Bull", detail: "Alfaiataria" },
  { name: "King Joe" },
  { name: "Crocker", detail: "Jeans" },
  { name: "Departamento" },
  { name: "Highstil", detail: "Jeans" },
  { name: "Highstil", detail: "Alfaiataria" },
  { name: "Resumo", detail: "Jeans & Alfaiataria" },
  { name: "Lopper", detail: "Jeans" },
  { name: "Ognus", detail: "Jeans" },
  { name: "Sallo" },
  { name: "D&0" },
  { name: "Savelli", detail: "Calçados" },
  { name: "Domary", detail: "Calçados", provisional: true },
  { name: "Diamantes", detail: "Lingerie" },
];

function BrandGroup({ hidden = false }: { hidden?: boolean }) {
  return (
    <div aria-hidden={hidden || undefined} className={styles.group}>
      {brands.map((brand) => (
        <div
          className={`${styles.brand} ${brand.provisional ? styles.provisional : ""}`}
          key={`${brand.name}-${brand.detail ?? "marca"}`}
        >
          <span aria-hidden="true" className={styles.mark}>{brand.name.slice(0, 2)}</span>
          <span className={styles.name}>
            {brand.name}
            {brand.detail ? <span className={styles.detail}>{brand.detail}</span> : null}
          </span>
        </div>
      ))}
    </div>
  );
}

export function BrandMarquee() {
  return (
    <section aria-labelledby="brand-marquee-title" className={styles.section}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className={styles.eyebrow}>Marcas selecionadas</p>
        <h2 className={styles.title} id="brand-marquee-title">Você encontra na Domary</h2>
      </div>
      <div className={styles.viewport}>
        <div className={styles.track}>
          <BrandGroup />
          <BrandGroup hidden />
        </div>
      </div>
    </section>
  );
}
