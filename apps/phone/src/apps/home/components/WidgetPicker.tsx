import React from 'react';
import { IHomeWidgetConfig, IHomeWidgetSize } from '@os/apps/config/apps';

export type ResolvedHomeWidget = IHomeWidgetConfig & { widgetId: string };

interface Props {
  widgets: ResolvedHomeWidget[];
  onAdd: (widget: ResolvedHomeWidget, size: IHomeWidgetSize) => void;
  onClose: () => void;
}

export const WidgetPicker: React.FC<Props> = ({ widgets, onAdd, onClose }) => (
  <div className="absolute inset-0 z-[10000] flex items-end overflow-hidden bg-black/55" onClick={onClose}>
    <div
      className="max-h-[72%] w-full overflow-y-auto rounded-t-3xl border-t border-white/15 bg-neutral-950/95 px-4 pb-8 pt-4 text-white shadow-2xl backdrop-blur-xl"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Adicionar widget</h2>
          <p className="text-xs text-white/55">Escolha o modelo e o tamanho.</p>
        </div>
        <button className="h-9 w-9 rounded-full bg-white/10 text-xl" onClick={onClose} aria-label="Fechar">×</button>
      </div>
      <div className="space-y-3">
        {widgets.filter((widget) => widget && Array.isArray(widget.sizes)).map((widget) => (
          <div key={widget.widgetId} className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="font-semibold">{widget.name}</div>
            {widget.description && <div className="mt-0.5 text-xs text-white/55">{widget.description}</div>}
            <div className="mt-3 flex flex-wrap gap-2">
              {widget.sizes.map((size) => (
                <button
                  key={`${size.width}x${size.height}`}
                  className="rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold transition-colors hover:bg-white/20"
                  onClick={() => onAdd(widget, size)}
                >
                  {size.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);
