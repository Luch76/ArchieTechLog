import { motion } from 'motion/react';
import { Sparkles, Clock, Rocket } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface ModuleComingSoonProps {
  /**
   * Module name to display
   * @example "Analytics Dashboard"
   */
  moduleName?: string;
  
  /**
   * Optional description
   */
  description?: string;
  
  /**
   * Show animated skeleton preview
   * @default true
   */
  showSkeleton?: boolean;
}

/**
 * Modern "Coming Soon" component for modules under development
 * 
 * Features:
 * - Animated entrance with motion (motion/react)
 * - Skeleton loading preview
 * - Gradient accents
 * - Responsive design
 * - Glass morphism effect
 * 
 * @example
 * <ModuleComingSoon 
 *   moduleName="Analytics Dashboard" 
 *   description="Advanced metrics and insights"
 * />
 */
export function ModuleComingSoon({
  moduleName = 'Module',
  description,
  showSkeleton = true,
}: ModuleComingSoonProps) {
  return (
    <div data-vid="ri7l8x9" className="min-h-[80vh] flex items-center justify-center p-4 md:p-8">
      <motion.div data-vid="vpdh57r"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl"
      >
        <Card data-vid="3fd962k" className="relative overflow-hidden border-2 border-dashed border-primary/20 bg-gradient-to-br from-background via-background to-primary/5 backdrop-blur-sm">
          {/* Animated gradient background */}
          <motion.div data-vid="7a3ku2j"
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%'],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
            className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 bg-[length:200%_200%]"
          />

          <div data-vid="bii05u4" className="relative p-8 md:p-12 space-y-8">
            {/* Header */}
            <div data-vid="jgrm6hs" className="text-center space-y-4">
              <motion.div data-vid="28ydaqy"
                animate={{
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="inline-block"
              >
                <div data-vid="pcnz6ek" className="relative">
                  <div data-vid="3y2sxi7" className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                  <div data-vid="xjd2cl5" className="relative bg-primary/10 p-6 rounded-full">
                    <Sparkles data-vid="z9wqjxw" className="w-12 h-12 text-primary" />
                  </div>
                </div>
              </motion.div>

              <div data-vid="d2lmc7b" className="space-y-2">
                <Badge data-vid="ebwr8wj" variant="secondary" className="gap-1.5">
                  <Clock data-vid="j1c290r" className="w-3 h-3" />
                  Under Development
                </Badge>
                
                <motion.h2 data-vid="cdr83sx"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent"
                >
                  {moduleName}
                </motion.h2>
                
                <motion.p data-vid="7pvq7dz"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-lg text-muted-foreground max-w-md mx-auto"
                >
                  This module is not yet available
                </motion.p>

                {description && (
                  <motion.p data-vid="p9127dj"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-sm text-muted-foreground max-w-lg mx-auto pt-2"
                  >
                    {description}
                  </motion.p>
                )}
              </div>
            </div>

            {/* Skeleton Preview */}
            {showSkeleton && (
              <motion.div data-vid="3dqf9l9"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-4"
              >
                <div data-vid="p6vjxy0" className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <motion.div data-vid="no3p2jv"
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                    >
                      <Card data-vid="dbmhy6v" className="p-6 space-y-3 bg-card/50 backdrop-blur-sm">
                        <Skeleton data-vid="udpp0q9" className="h-12 w-12 rounded-lg" />
                        <Skeleton data-vid="kuzqcig" className="h-4 w-3/4" />
                        <Skeleton data-vid="3nkr5qn" className="h-3 w-full" />
                        <Skeleton data-vid="sbhbucn" className="h-3 w-2/3" />
                      </Card>
                    </motion.div>
                  ))}
                </div>

                <Card data-vid="o3b6v0w" className="p-6 space-y-4 bg-card/50 backdrop-blur-sm">
                  <div data-vid="9cr85yr" className="flex items-center gap-4">
                    <Skeleton data-vid="a7lijwg" className="h-16 w-16 rounded-full" />
                    <div data-vid="mavt3hw" className="flex-1 space-y-2">
                      <Skeleton data-vid="9yu2mxl" className="h-4 w-1/4" />
                      <Skeleton data-vid="p7p2z44" className="h-3 w-1/2" />
                    </div>
                  </div>
                  <div data-vid="pio3fwb" className="space-y-2">
                    <Skeleton data-vid="5jpr0mw" className="h-3 w-full" />
                    <Skeleton data-vid="7z4gemj" className="h-3 w-5/6" />
                    <Skeleton data-vid="afyxih3" className="h-3 w-4/6" />
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Footer Message */}
            <motion.div data-vid="hlnup7g"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-center pt-4"
            >
              <div data-vid="wnfur3a" className="inline-flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-full backdrop-blur-sm">
                <Rocket data-vid="lrc312m" className="w-4 h-4" />
                <span data-vid="b5xpuh4">We're working hard to bring this to you soon</span>
              </div>
            </motion.div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

