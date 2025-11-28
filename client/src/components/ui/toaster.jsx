import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider duration={3000}>
      {toasts.map(function ({
        id,
        title,
        description,
        action,
        variant,
        ...props
      }) {
        const isDestructive = variant === "destructive";
        const borderColor = isDestructive
          ? "border-l-red-500"
          : "border-l-cyan-500";
        const shadowColor = isDestructive
          ? "shadow-red-500/10"
          : "shadow-cyan-500/10";
        const progressColor = isDestructive ? "bg-red-500" : "bg-cyan-500";

        return (
          <Toast
            key={id}
            variant={variant}
            duration={3000}
            {...props}
            className={`glass-panel border-l-2 ${borderColor} bg-white/90 dark:bg-slate-950/90 backdrop-blur-3xl border-y-slate-200/40 border-r-slate-200/40 dark:border-y-white/5 dark:border-r-white/5 shadow-xl ${shadowColor} overflow-hidden pb-2 rounded-2xl`}
          >
            <div className="grid gap-0.5 relative z-10">
              {title && (
                <ToastTitle
                  className={`text-sm font-semibold ${
                    isDestructive
                      ? "text-red-500 dark:text-red-400"
                      : "text-slate-900 dark:text-white"
                  }`}
                >
                  {title}
                </ToastTitle>
              )}
              {description && (
                <ToastDescription className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {description}
                </ToastDescription>
              )}
            </div>
            {action}
            <ToastClose className="text-slate-400 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white transition-colors" />

            {/* Dismiss Progress Bar */}
            <div className="absolute bottom-0 left-0 h-[2px] w-full bg-transparent">
              <div
                className={`h-full ${progressColor} animate-[progress_3s_linear_forwards] origin-left opacity-80`}
              />
            </div>
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
