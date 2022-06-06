import { render } from 'solid-js/web'
import './index.css'
import { createEffect, createSignal, JSX, Show } from 'solid-js'
import { createVirtualizer, createItemRef } from '@tanstack/solid-virtual'
import { For } from 'solid-js'

const rows = new Array(10000)
  .fill(true)
  .map(() => 25 + Math.round(Math.random() * 100))

const columns = new Array(10000)
  .fill(true)
  .map(() => 75 + Math.round(Math.random() * 100))

function RowVirtualizerDynamic(params): JSX.Element {
  let parentRef: HTMLDivElement

  const rowVirtualizer = createVirtualizer<HTMLDivElement, HTMLDivElement>({
    count: params.rows.length,
    getScrollElement() {
      return parentRef
    },
    estimateSize: () => 50,
    paddingStart: 100,
    paddingEnd: 100,
  })

  createEffect(() => {
    rowVirtualizer.getVirtualItems()
  })

  return (
    <div
      ref={parentRef}
      class="List"
      style={{
        height: '200px',
        width: '400px',
        overflow: 'auto',
      }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        <For each={rowVirtualizer.getVirtualItems()}>
          {(virtualRow) => {
            return (
              <div
                ref={createItemRef(virtualRow)}
                classList={{
                  ListItemOdd: !!(virtualRow.index % 2),
                  ListItemEven: !(virtualRow.index % 2),
                }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${params.rows[virtualRow.index]}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                Row {virtualRow.index}
              </div>
            )
          }}
        </For>
      </div>
    </div>
  )
}

function ColumnVirtualizerDynamic(params): JSX.Element {
  let parentRef: HTMLDivElement

  const columnVirtualizer = createVirtualizer({
    horizontal: true,
    count:  params.columns.length,
    getScrollElement() {
      return parentRef
    },
    estimateSize() {
      return 50
    },
    paddingStart: 100,
    paddingEnd: 100,
  })

  return (
    <>
      <div
        ref={parentRef}
        class="List"
        style={{
          width: 400,
          height: `100px`,
          overflow: 'auto',
        }}
      >
        <div
          style={{
            width: `${columnVirtualizer.getTotalSize()}px`,
            height: '100%',
            position: 'relative',
          }}
        >
          <For each={columnVirtualizer.getVirtualItems()}>
            {(virtualColumn) => (
              <div
                ref={createItemRef(virtualColumn)}
                class={virtualColumn.index % 2 ? 'ListItemOdd' : 'ListItemEven'}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: '100%',
                  width: `${params.columns[virtualColumn.index]}px`,
                  transform: `translateX(${virtualColumn.start}px)`,
                }}
              >
                Column {virtualColumn.index}
              </div>
            )}
          </For>
        </div>
      </div>
    </>
  )
}

function GridVirtualizerDynamic(params): JSX.Element {
  let parentRef: HTMLDivElement

  const rowVirtualizer = createVirtualizer({
    count: params.rows.length,
    getScrollElement() {
      return parentRef
    },
    estimateSize() {
      return 50
    },
    paddingStart: 200,
    paddingEnd: 200,
  })

  const columnVirtualizer = createVirtualizer({
    horizontal: true,
    count: params.columns.length,
    getScrollElement() {
      return parentRef
    },
    estimateSize() {
      return 50
    },
    paddingStart: 200,
    paddingEnd: 200,
  })

  const [show, setShow] = createSignal(true)

  const halfWay = Math.floor(params.rows.length / 2)

  return (
    <>
      <button onClick={() => setShow((old) => !old)}>Toggle</button>
      <button onClick={() => rowVirtualizer.scrollToIndex(halfWay)}>
        Scroll to index {halfWay}
      </button>
      <button
        onClick={() => rowVirtualizer.scrollToIndex(params.rows.length - 1)}
      >
        Scroll to index {params.rows.length - 1}
      </button>
      <Show when={show()}>
        <div
          ref={parentRef}
          class="List"
          style={{
            height: '400px',
            width: '500px',
            overflow: 'auto',
          }}
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: columnVirtualizer.getTotalSize(),
              position: 'relative',
            }}
          >
            <For each={rowVirtualizer.getVirtualItems()}>
              {(virtualRow) => (
                <For each={columnVirtualizer.getVirtualItems()}>
                  {(virtualColumn) => (
                    <div
                      ref={createItemRef([virtualRow, virtualColumn])}
                      class={
                        virtualColumn.index % 2
                          ? virtualRow.index % 2 === 0
                            ? 'ListItemOdd'
                            : 'ListItemEven'
                          : virtualRow.index % 2
                          ? 'ListItemOdd'
                          : 'ListItemEven'
                      }
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: `${params.columns[virtualColumn.index]}px`,
                        height: `${params.rows[virtualRow.index]}px`,
                        transform: `translateX(${virtualColumn.start}px) translateY(${virtualRow.start}px)`,
                      }}
                    >
                      Cell {virtualRow.index}, {virtualColumn.index}
                    </div>
                  )}
                </For>
              )}
            </For>
          </div>
        </div>
      </Show>
      <br />
      <br />
      {process.env.NODE_ENV === 'development' && (
        <p>
          <strong>Notice:</strong> You are currently running Solid in
          development mode. Rendering performance will be slightly degraded
          until this application is build for production.
        </p>
      )}
    </>
  )
}

function App(): JSX.Element {
  return (
    <div>
      <p>
        These components are using <strong>dynamic</strong> sizes. This means
        that each element's exact dimensions are unknown when rendered. An
        estimated dimension is used to get an a initial measurement, then this
        measurement is readjusted on the fly as each element is rendered.
      </p>
      <br />
      <br />
      <h3>Rows</h3>
      <RowVirtualizerDynamic rows={rows} />
      <br />
      <br />
      <h3>Columns</h3>
      <ColumnVirtualizerDynamic columns={columns} />
      <br />
      <br />
      <h3>Grid</h3>
      <GridVirtualizerDynamic rows={rows} columns={columns} />
    </div>
  )
}

render(() => <App />, document.getElementById('root') as HTMLElement)
