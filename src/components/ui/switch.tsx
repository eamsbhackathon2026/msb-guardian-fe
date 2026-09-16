import * as SwitchPrimitive from '@radix-ui/react-switch'
import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/lib/utils'

export function Switch({ className, ...props }: ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        'relative h-[31px] w-[51px] shrink-0 cursor-pointer rounded-full p-[2px] transition-colors duration-200 data-[state=checked]:bg-primary data-[state=unchecked]:bg-line',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="block h-[27px] w-[27px] rounded-full bg-white shadow-card transition-transform duration-200 data-[state=checked]:translate-x-[20px]" />
    </SwitchPrimitive.Root>
  )
}
