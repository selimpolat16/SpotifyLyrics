declare module 'react-beautiful-dnd' {
  import * as React from 'react'

  export interface DraggableLocation {
    droppableId: string
    index: number
  }

  export interface DragStart {
    draggableId: string
    type: string
    source: DraggableLocation
  }

  export interface DropResult {
    draggableId: string
    type: string
    source: DraggableLocation
    destination: DraggableLocation | null
    reason: 'DROP' | 'CANCEL'
  }

  export interface DraggableProvided {
    innerRef: (element: HTMLElement | null) => void
    draggableProps: {
      'data-rbd-draggable-context-id': string
      'data-rbd-draggable-id': string
      style?: React.CSSProperties
      onTransitionEnd?: (event: React.TransitionEvent<any>) => void
    }
    dragHandleProps: {
      'data-rbd-drag-handle-draggable-id': string
      'data-rbd-drag-handle-context-id': string
      'aria-describedby': string
      role: string
      tabIndex: number
      draggable: boolean
      onDragStart: (event: React.DragEvent<any>) => void
    } | null
  }

  export interface DroppableProvided {
    innerRef: (element: HTMLElement | null) => void
    placeholder?: React.ReactElement<any> | null
    droppableProps: {
      'data-rbd-droppable-context-id': string
      'data-rbd-droppable-id': string
    }
  }

  export interface DroppableProps {
    droppableId: string
    type?: string
    mode?: 'standard' | 'virtual'
    isDropDisabled?: boolean
    isCombineEnabled?: boolean
    direction?: 'vertical' | 'horizontal'
    ignoreContainerClipping?: boolean
    renderClone?: any
    getContainerForClone?: any
    children: (provided: DroppableProvided) => React.ReactElement<any>
  }

  export interface DraggableProps {
    draggableId: string
    index: number
    isDragDisabled?: boolean
    disableInteractiveElementBlocking?: boolean
    shouldRespectForcePress?: boolean
    children: (provided: DraggableProvided) => React.ReactElement<any>
  }

  export interface DragDropContextProps {
    onBeforeCapture?: (before: any) => void
    onBeforeDragStart?: (initial: DragStart) => void
    onDragStart?: (initial: DragStart) => void
    onDragUpdate?: (initial: any) => void
    onDragEnd: (result: DropResult) => void
    children?: React.ReactNode
  }

  export class DragDropContext extends React.Component<DragDropContextProps> {}
  export class Droppable extends React.Component<DroppableProps> {}
  export class Draggable extends React.Component<DraggableProps> {}
} 