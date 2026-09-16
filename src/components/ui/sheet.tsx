import * as DialogPrimitive from '@radix-ui/react-dialog'
import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/lib/utils'

export const Sheet = DialogPrimitive.Root
export const SheetTrigger = DialogPrimitive.Trigger
export const SheetClose = DialogPrimitive.Close
export const SheetTitle = DialogPrimitive.Title

/** Bottom sheet — dùng trong khung điện thoại nên portal vào container của MobileFrame */
export function SheetContent({ className, children, container, ...props }: ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { container?: HTMLElement | null }) {
  return (
    <DialogPrimitive.Portal container={container}>
      <DialogPrimitive.Overlay className="absolute inset-0 z-50 bg-black/45" />
      <DialogPrimitive.Content
        className={cn(
          'absolute inset-x-0 bottom-0 z-50 rounded-t-[24px] bg-surface p-5 pb-8 shadow-pop outline-none',
          className,
        )}
        {...props}
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-line" />
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}
