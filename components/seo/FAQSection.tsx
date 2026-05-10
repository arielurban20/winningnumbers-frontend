"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { HelpCircle } from "lucide-react"

interface FAQItem {
  question: string
  answer: string
}

interface FAQSectionProps {
  title?: string
  faqs?: FAQItem[]
  items?: FAQItem[]  // Alias for faqs
}

export function FAQSection({ 
  title = "Frequently Asked Questions", 
  faqs, 
  items 
}: FAQSectionProps) {
  // Support both 'faqs' and 'items' props
  const faqItems = faqs || items || []
  
  if (faqItems.length === 0) return null

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2">
        <HelpCircle className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      </div>
      <Accordion type="single" collapsible className="w-full">
        {faqItems.map((faq, index) => (
          <AccordionItem 
            key={index} 
            value={`faq-${index}`}
            className="border-b border-border/50"
          >
            <AccordionTrigger className="text-left py-5 hover:no-underline hover:text-primary transition-colors">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  )
}
