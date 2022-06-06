import {
  elementScroll,
  observeElementOffset,
  observeElementRect,
  observeWindowOffset,
  observeWindowRect,
  PartialKeys,
  Virtualizer,
  VirtualizerOptions,
  windowScroll,
  VirtualItem,
} from '@tanstack/virtual-core'
export * from '@tanstack/virtual-core'
import {
  onMount,
  onCleanup,
  on,
  createMemo,
  createEffect,
  createSignal,
  batch,
  createRenderEffect,
} from 'solid-js'

//

/**
 * @private
 */
type CreateVirtualBaseOptions<TScrollElement, TItemElement> = PartialKeys<
  VirtualizerOptions<TScrollElement, TItemElement>,
  | 'getScrollElement'
  | 'observeElementRect'
  | 'observeElementOffset'
  | 'scrollToFn'
>

function createVirtualizerBase<TScrollElement, TItemElement = unknown>(
  getScrollElement: VirtualizerOptions<
    TScrollElement,
    TItemElement
  >['getScrollElement'],
  options: CreateVirtualBaseOptions<TScrollElement, TItemElement>,
  elemOptions: Pick<
    VirtualizerOptions<TScrollElement, TItemElement>,
    'observeElementRect' | 'observeElementOffset' | 'scrollToFn'
  >,
): Virtualizer<TScrollElement, TItemElement> {
  let rerender: () => void

  const resolvedOptions = createMemo(
    (): VirtualizerOptions<TScrollElement, TItemElement> => {
      return {
        getScrollElement,
        ...options,
        ...elemOptions,
        onChange: (instance) => {
          rerender()
          options.onChange?.(instance)
        },
      }
    },
  )

  const instance = new Virtualizer<TScrollElement, TItemElement>(
    resolvedOptions(),
  )

  const [virtualItems, setVirtualItems] = createSignal<
    ReturnType<typeof instance['getVirtualItems']>
  >(instance.getVirtualItems())
  const [totalSize, setTotalSize] = createSignal(0)

  let rerenderRAFRef: number | null = null

  rerender = () => {
    if(!rerenderRAFRef) {
      rerenderRAFRef = requestAnimationFrame(() => {
        try {
          batch(() => {
            setTotalSize(instance.getTotalSize())
            setVirtualItems(instance.getVirtualItems())
          })
        } finally {
          rerenderRAFRef = null
        }
      })
    }
  }

  onCleanup(() => {
    rerenderRAFRef && cancelAnimationFrame(rerenderRAFRef)
  })

  onMount(() => {
    const cleanup = instance._didMount()

    onCleanup(() => {
      cleanup()
    })
  })

  createRenderEffect(
    on(
      () => [totalSize(), virtualItems(), resolvedOptions()],
      () => {
        instance._willUpdate()
      },
    ),
  )

  createEffect(
    on(
      () => [resolvedOptions()],
      () => {
        instance.setOptions(resolvedOptions())
      },
      { defer: true },
    ),
  )

  return new Proxy(instance, {
    get(target: typeof instance, key: keyof typeof instance) {
      if (key === 'getVirtualItems') {
        return virtualItems
      }

      if (key === 'getTotalSize') {
        return totalSize
      }

      return target[key]
    },
  })
}

export function createVirtualizer<TScrollElement, TItemElement = unknown>(
  options: PartialKeys<
    VirtualizerOptions<TScrollElement, TItemElement>,
    'observeElementRect' | 'observeElementOffset' | 'scrollToFn'
  >,
): Virtualizer<TScrollElement, TItemElement> {
  return createVirtualizerBase<TScrollElement, TItemElement>(
    options.getScrollElement,
    options,
    {
      observeElementRect: observeElementRect,
      observeElementOffset: observeElementOffset,
      scrollToFn: elementScroll,
    },
  )
}

export function createWindowVirtualizer<TItemElement = unknown>(
  options: PartialKeys<
    VirtualizerOptions<Window, TItemElement>,
    | 'getScrollElement'
    | 'observeElementRect'
    | 'observeElementOffset'
    | 'scrollToFn'
  >,
): Virtualizer<Window, TItemElement> {
  const getScrollElement = () =>
    typeof window !== 'undefined' ? window : null!
  return createVirtualizerBase<Window, TItemElement>(
    getScrollElement,
    options,
    {
      observeElementRect: observeWindowRect,
      observeElementOffset: observeWindowOffset,
      scrollToFn: windowScroll,
    },
  )
}

export type Consumer<T> = (value: T) => void

export function createItemRef<TItemElement>(
  virtualItem: VirtualItem<TItemElement>,
): Consumer<TItemElement>
export function createItemRef<TItemElement>(
  virtualItemList: VirtualItem<TItemElement>[],
): Consumer<TItemElement>
export function createItemRef<TItemElement>(
  virtualItems: VirtualItem<TItemElement>[] | VirtualItem<TItemElement>,
): Consumer<TItemElement> {
  return (el: TItemElement): void => {
    // SolidJs ref callbacks are invoked before the element is inserted in the DOM.
    // It's imperative that we make measurements after the element is part of the document.
    //
    // We could have used directives but unfortunately there's currently an issue with typescript:
    // - https://github.com/solidjs/solid/issues/569#issuecomment-882721883
    // - https://github.com/solidjs/solid/issues/1005
    onMount(() => {
      const items = Array.isArray(virtualItems) ? virtualItems : [virtualItems]

      for (const item of items) {
        item.measureElement(el)
      }
    })
  }
}
