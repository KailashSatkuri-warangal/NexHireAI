
'use client';

import { motion } from 'framer-motion';

export function About() {
  return (
    <section id="about" className="py-16 sm:py-24 bg-background/50">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
            className="max-w-3xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            What is NexHireAI?
          </h2>
          <p className="mt-4 text-muted-foreground md:text-xl">
            NexHireAI is a revolutionary platform that leverages cutting-edge AI to create dynamic, adaptive skill assessments. We move beyond static questionnaires to simulate real-world challenges, providing deep insights into a candidate's true potential and job readiness.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

    