
'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const tools = [
  { name: 'Rive', description: 'Interactive vector animations that respond to real-time user input.', imageId: 'rive-bg' },
  { name: 'Blender', description: 'Full 3D modeling, sculpting, and keyframe animation for movies and games.', imageId: 'blender-bg' },
  { name: 'Autodesk Maya', description: 'Advanced rigging and character animation tools used in film and AAA games.', imageId: 'maya-bg' },
  { name: 'Autodesk 3ds Max', description: 'Powerful polygonal and spline modeling for architectural and game assets.', imageId: '3dsmax-bg' },
  { name: 'Cinema 4D', description: 'Industry-leading MoGraph tools for procedural motion graphics and VFX.', imageId: 'c4d-bg' },
  { name: 'Houdini', description: 'Node-based procedural workflow for complex particle and fluid simulations.', imageId: 'houdini-bg' },
  { name: 'Unity 3D', description: 'Real-time 3D engine with integrated animation controllers and timelines.', imageId: 'unity-bg' },
  { name: 'Unreal Engine', description: 'High-end engine with cinematic tools and photorealistic real-time rendering.', imageId: 'unreal-bg' },
  { name: 'Mixamo', description: 'Web-based auto-rigging and a vast library of pre-made character animations.', imageId: 'mixamo-bg' },
];

export function TheEvolution() {
  const targetRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ['start end', 'end start'],
  });

  return (
    <section ref={targetRef} id="evolution" className="py-16 sm:py-24">
       <div className="container mx-auto px-4 md:px-6 text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">The Evolution of Assessment</h2>
            <p className="mt-4 max-w-2xl mx-auto text-muted-foreground md:text-lg">
                Just as digital creation evolved from simple vectors to immersive 3D worlds, NexHireAI evolves assessment from static questions to dynamic, real-world simulations.
            </p>
       </div>
      <div className="mt-12 space-y-8 md:space-y-16">
        {tools.map((tool, index) => (
          <ToolCard key={tool.name} tool={tool} index={index} scrollYProgress={scrollYProgress} />
        ))}
      </div>
    </section>
  );
}

const ToolCard = ({ tool, index, scrollYProgress }: { tool: (typeof tools)[0], index: number, scrollYProgress: any }) => {
    const scale = useTransform(scrollYProgress, [0.1 + index * 0.08, 0.15 + index * 0.08], [0.8, 1]);
    const opacity = useTransform(scrollYProgress, [0.1 + index * 0.08, 0.15 + index * 0.08], [0, 1]);
    const rotateX = useTransform(scrollYProgress, [0.1 + index * 0.08, 0.15 + index * 0.08], ['15deg', '0deg']);
    const image = PlaceHolderImages.find(img => img.id === tool.imageId);

  return (
    <motion.div
        style={{
            scale,
            opacity,
            rotateX,
            transformOrigin: 'top center',
            perspective: '1000px',
        }}
        className="h-[300px] md:h-[400px] w-full max-w-4xl mx-auto"
    >
      <Card className="w-full h-full relative overflow-hidden shadow-2xl">
        {image && (
            <Image
                src={image.imageUrl}
                alt={tool.name}
                fill
                className="object-cover"
                data-ai-hint={image.imageHint}
            />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-6 md:p-8 flex flex-col justify-end">
          <h3 className="text-2xl md:text-3xl font-bold text-white shadow-black [text-shadow:0_2px_4px_var(--tw-shadow-color)]">{tool.name}</h3>
          <p className="text-sm md:text-base text-white/80 mt-2 max-w-md shadow-black [text-shadow:0_1px_2px_var(--tw-shadow-color)]">{tool.description}</p>
        </div>
      </Card>
    </motion.div>
  );
};

    