import React, { useCallback, useEffect, useRef, useState } from "react";
import { tasks, columns } from "./mock";
import {
  closestCenter,
  pointerWithin,
  rectIntersection,
  getFirstCollision,
  useSensors,
  useSensor,
  MouseSensor,
  DndContext,
  MeasuringStrategy,
  DragOverlay,
  DragStartEvent,
  UniqueIdentifier,
  DragOverEvent,
  Active,
  Over,
  CollisionDetection,
  Collision,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { createPortal } from "react-dom";
import update from "immutability-helper";
import List from "./components/List";
import Task from "./components/Task";

type Props = {
  Tasks: typeof tasks;
  List: typeof columns;
};

const Kanban = ({ List: columns, Tasks: tasks }: Props) => {
  const [data, setData] = useState<typeof tasks>(tasks);
  const [items, setItems] = useState<Record<UniqueIdentifier, string[]>>({});
  const [containers, setContainers] = useState<UniqueIdentifier[]>([]);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const lastOverId = useRef<UniqueIdentifier | null>(null);
  const recentlyMovedToNewContainer = useRef(false);
  const isSortingContainer = activeId ? containers.includes(activeId) : false;

  useEffect(() => {
    if (tasks) {
      setData(tasks);
      let cols = {} as Record<string, string[]>;
      columns.sort((a, b) => a.order - b.order);
      columns.forEach((c) => {
        cols["column-" + c.id] = [];
      });
      tasks.forEach((d) => {
        if (!("column-" + d.col_id in cols)) {
          cols["column-" + d.col_id] = [];
        }
        cols["column-" + d.col_id]?.push("task-" + d.id);
      });
      setItems(cols);
      setContainers(Object.keys(cols));
      console.log("====", {
        tasks,
        acC: columns,
        data: tasks,
        columns,
        cols,
        containers: Object.keys(cols),
      });
    }
  }, [tasks, columns]);

  const moveBetweenContainers = useCallback(
    (
      activeContainer: UniqueIdentifier,
      overContainer: UniqueIdentifier,
      active: Active,
      over: Over,
      overId: UniqueIdentifier
    ) => {
      const activeItems = items[activeContainer];
      const overItems = items[overContainer];
      const overIndex = overItems?.indexOf(overId as string);
      const activeIndex = activeItems?.indexOf(active.id as string);

      let newIndex;

      if (overId in items) {
        newIndex = overItems!.length + 1;
      } else {
        const isBelowOverItem =
          over &&
          active.rect?.current?.translated &&
          active.rect?.current?.translated.top >=
            over.rect?.top + over.rect?.height;

        const modifier = isBelowOverItem ? 1 : 0;

        newIndex =
          overIndex && overIndex >= 0
            ? overIndex + modifier
            : overItems && overItems.length + 1;
      }
      recentlyMovedToNewContainer.current = true;

      setItems(
        update(items, {
          [activeContainer]: {
            $splice: [[activeIndex, 1]],
          },
          [overContainer]: {
            $splice: [[newIndex, 0, active.id]],
          },
        } as any)
      );
    },
    [items]
  );

  /**
   * Custom collision detection strategy optimized for multiple containers
   *
   * - First, find any droppable containers intersecting with the pointer.
   * - If there are none, find intersecting containers with the active draggable.
   * - If there are no intersecting containers, return the last matched intersection
   *
   */
  const collisionDetectionStrategy = useCallback<CollisionDetection>(
    (args) => {
      if (activeId && activeId in items) {
        return closestCenter({
          ...args,
          droppableContainers: args.droppableContainers.filter(
            (container) => container.id in items
          ),
        });
      }

      // Start by finding any intersecting droppable
      const pointerIntersections = pointerWithin(args);
      const intersections =
        pointerIntersections.length > 0
          ? // If there are droppables intersecting with the pointer, return those
            pointerIntersections
          : rectIntersection(args);
      let overId = getFirstCollision(intersections, "id");

      if (overId !== null) {
        if (overId in items) {
          const containerItems = items[overId];

          // If a container is matched and it contains items (columns 'A', 'B', 'C')
          if (containerItems && containerItems.length > 0) {
            // Return the closest droppable within that container
            overId =
              closestCenter({
                ...args,
                droppableContainers: args.droppableContainers.filter(
                  (container) =>
                    container.id !== overId &&
                    containerItems.includes(container.id as string)
                ),
              })[0]?.id || null;
          }
        }

        lastOverId.current = overId;

        return [{ id: overId }] as Collision[];
      }

      // When a draggable item moves to a new container, the layout may shift
      // and the `overId` may become `null`. We manually set the cached `lastOverId`
      // to the id of the draggable item that was moved to the new container, otherwise
      // the previous `overId` will be returned which can cause items to incorrectly shift positions
      if (recentlyMovedToNewContainer.current) {
        lastOverId.current = activeId;
      }

      // If no droppable is matched, return the last match
      return lastOverId.current ? [{ id: lastOverId.current }] : [];
    },
    [activeId, items]
  );

  const [clonedItems, setClonedItems] = useState<Record<
    UniqueIdentifier,
    string[]
  > | null>(null);
  const sensors = useSensors(
    useSensor(MouseSensor, {
      // activationConstraint: {
      //   //distance: 5,
      //   delay: 0,
      //   tolerance: 1,
      // },
    })
  );

  const findContainer = (id: UniqueIdentifier) => {
    if (id in items) return id;
    return containers.find((key) => items[key]?.includes(id as string));
  };

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(active.id);
    setClonedItems(items);
  }

  function handleDragOver({ active, over }: DragOverEvent) {
    const overId = over?.id;

    if (!overId || active.id in items) return;

    const overContainer = findContainer(overId);
    const activeContainer = findContainer(active.id);

    if (!overContainer || !activeContainer) return;

    if (activeContainer !== overContainer) {
      moveBetweenContainers(
        activeContainer,
        overContainer,
        active,
        over,
        overId
      );
    }
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over) {
      setActiveId(null);
      return;
    }

    if (active.id in items && over?.id) {
      setContainers((containers) => {
        const activeIndex = containers.indexOf(active.id);
        const overIndex = containers.indexOf(over.id);

        return arrayMove(containers, activeIndex, overIndex);
      });
    }

    const activeContainer = findContainer(active.id);

    if (!activeContainer) {
      setActiveId(null);
      return;
    }

    const overContainer = findContainer(over.id);

    if (overContainer) {
      const activeIndex = items[activeContainer]?.indexOf(active.id as string);
      const overIndex = items[overContainer]?.indexOf(over.id as string);

      if (activeIndex !== overIndex) {
        setItems((items) => ({
          ...items,
          [overContainer]: arrayMove(
            items[overContainer]!,
            activeIndex!,
            overIndex!
          ),
        }));
      }
    }

    setActiveId(null);
  }

  const handleDragCancel = () => {
    if (clonedItems) {
      // Reset items to their original state in case items have been
      // Dragged across containers
      setItems(clonedItems);
    }

    setActiveId(null);
    setClonedItems(null);
  };

  useEffect(() => {
    requestAnimationFrame(() => {
      recentlyMovedToNewContainer.current = false;
    });
  }, [items]);

  return (
    <div>
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetectionStrategy}
        measuring={{
          droppable: {
            strategy: MeasuringStrategy.WhileDragging,
          },
        }}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex flex-row p-10">
          <SortableContext
            items={containers}
            strategy={horizontalListSortingStrategy}
          >
            {containers.map((containerId) => {
              return (
                <List
                  id={containerId}
                  key={containerId}
                  items={items[containerId]!}
                  name={
                    columns.filter((c) => "column-" + c.id === containerId)[0]!
                      .name
                  }
                  data={data}
                  isSortingContainer={isSortingContainer}
                />
              );
            })}
          </SortableContext>
        </div>
        {createPortal(
          <DragOverlay
            adjustScale={false}
            dropAnimation={{
              duration: 75,
            }}
          >
            {activeId ? (
              containers.includes(activeId) ? (
                <List
                  id={activeId}
                  items={items[activeId]!}
                  name={
                    columns.filter((c) => "column-" + c.id === activeId)[0]!
                      .name
                  }
                  data={data}
                  dragOverlay
                />
              ) : (
                <Task
                  id={activeId}
                  item={data.filter((d) => "task-" + d.id === activeId)[0]}
                  dragOverlay
                />
              )
            ) : null}
          </DragOverlay>,
          document.body
        )}
      </DndContext>
    </div>
  );
};

export default Kanban;
