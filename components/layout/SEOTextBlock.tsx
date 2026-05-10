interface SEOTextBlockProps {
  title: string
  content: string | string[]
  className?: string
}

/**
 * Reusable SEO content section with H2 heading
 */
export function SEOTextBlock({ title, content, className = "" }: SEOTextBlockProps) {
  const paragraphs = Array.isArray(content) ? content : [content]

  return (
    <section className={`space-y-3 ${className}`}>
      <h2 className="text-xl font-semibold">{title}</h2>
      {paragraphs.map((paragraph, index) => (
        <p key={index} className="leading-relaxed text-muted-foreground">
          {paragraph}
        </p>
      ))}
    </section>
  )
}
