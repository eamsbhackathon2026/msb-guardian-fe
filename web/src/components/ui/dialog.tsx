import * as DialogPrimitive from '@radix-ui/react-dialog'
import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/lib/utils'

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close
export const DialogTitle = DialogPrimitive.Title
export const DialogDescription = DialogPrimitive.Description

export function DialogContent({ className, children, container, ...props }: ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { container?: HTMLElement | null }) {
  return (
    <DialogPrimitive.Portal container={container}>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/45 data-[state=open]:animate-in" style={{ position: container ? 'absolute' : 'fixed' }} />
      <DialogPrimitive.Content
        className={cn(
          'z-50 w-[calc(100%-40px)] max-w-sm rounded-card bg-surface p-5 shadow-pop outline-none',
          container ? 'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2' : 'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
          className,
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}
