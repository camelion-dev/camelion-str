import Link from "next/link";

const promoTiles = [
  { name: "Batteries", area: "batteries", image: "batteries.jpeg" },
  { name: "Portable Devices", area: "portable", image: "portable.jpeg" },
  { name: "Chargers", area: "chargers", image: "chargers.jpeg" },
  { name: "Extension Wires", area: "extension", image: "extensions.jpeg" },
  { name: "Flashlights", area: "flashlights", image: "flashlights.jpeg" },
  { name: "Bundles", area: "bundles", image: "bundles.jpeg" },
];

export function PromoCollage() {
  return (
    <section aria-label="Shop by collection" className="promo-collage">
      <div className="promo-collage__grid">
        {promoTiles.map(({ name, area, image }) => (
          <Link
            key={name}
            href={`/?category=${encodeURIComponent(name)}#all-products`}
            aria-label={`Shop ${name}`}
            className={`promo-collage__tile promo-collage__tile--${area}`}
          >
            <img
              src={`/assets/collage/${image}`}
              alt={name}
              draggable={false}
              className="promo-collage__image"
            />
          </Link>
        ))}
      </div>
    </section>
  );
}