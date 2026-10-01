import Link from "next/link";

const promoTiles = [
  { name: "Batteries", area: "batteries" },
  { name: "Portable Devices", area: "portable" },
  { name: "Chargers", area: "chargers" },
  { name: "Extension Wires", area: "extension" },
  { name: "Flashlights", area: "flashlights" },
  { name: "Bundles", area: "bundles" },
];

export function PromoCollage() {
  return (
    <section aria-label="Shop by collection" className="promo-collage section-shell">
      <div className="promo-collage__grid">
        {promoTiles.map(({ name, area }) => (
          <Link
            key={name}
            href={`/?category=${encodeURIComponent(name)}#all-products`}
            aria-label={`Shop ${name}`}
            className={`promo-collage__tile promo-collage__tile--${area}`}
          >
            <span className="promo-collage__placeholder">{name.toUpperCase()} IMAGE</span>
          </Link>
        ))}
      </div>
    </section>
  );
}