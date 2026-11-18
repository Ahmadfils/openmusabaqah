export default function SectionHeading({
    eyebrow,
    title,
    description,
    center = false,
}: {
    eyebrow: string;
    title: string;
    description?: string;
    center?: boolean;
}) {
    return (
        <div className={center ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
            <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-gold-500">{eyebrow}</p>
            <h2 className="mt-2 text-3xl font-black text-white md:text-4xl">{title}</h2>
            {description && <p className="mt-3 text-sm leading-relaxed text-turquoise-300/80">{description}</p>}
        </div>
    );
}
