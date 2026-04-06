import type { Result } from "../error/index";
import type { ModalOptions, ToastOptions } from "../types/index";

export interface UIAdapter {
  toast(options: ToastOptions): Promise<Result<void>>;
  loading(show: boolean, title?: string): Promise<Result<void>>;
  modal(options: ModalOptions): Promise<Result<boolean>>;
}
