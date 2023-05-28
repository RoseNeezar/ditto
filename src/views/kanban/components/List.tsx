import {
  useSortable,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Badge } from "antd";
import React from "react";
import { CSS } from "@dnd-kit/utilities";
import { UniqueIdentifier } from "@dnd-kit/core";
import Task from "./Task";

type Props = {
  id: UniqueIdentifier;
  items: string[];
  name: string;
  data: any[];
  isSortingContainer?: boolean;
  dragOverlay?: boolean;
};

const List = (props: Props) => {
  const { id, items, name, data, isSortingContainer, dragOverlay } = props;

  const {
    //active,
    attributes,
    isDragging,
    listeners,
    //over,
    setNodeRef,
    transition,
    transform,
  } = useSortable({
    id: id,
    data: {
      type: "SECTION",
    },
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        cursor: dragOverlay ? "grabbing" : "grab",
        transition,
        display: "flex",
        flexDirection: "column",
      }}
      {...attributes}
      {...listeners}
      className="mx-3 min-h-[750px] w-56 bg-red-100"
    >
      <div
        style={{
          boxShadow: dragOverlay
            ? "0 0 0 calc(1px / 1) rgba(63, 63, 68, 0.05), -1px 0 15px 0 rgba(34, 33, 81, 0.01), 0px 15px 15px 0 rgba(34, 33, 81, 0.25)"
            : "",
          mixBlendMode: dragOverlay ? "revert" : "normal",
          border: dragOverlay
            ? "1px solid rgba(64, 150, 255, 1)"
            : "1px solid #dcdcdc", // 1px solid rgba(64, 150, 255, 1)
          opacity: isDragging ? 0.5 : 1,
          cursor: dragOverlay ? "grabbing" : "grab",
          transform: dragOverlay
            ? "rotate(0deg) scale(1.05)"
            : "rotate(0deg) scale(1.0)",
        }}
      >
        <div
          style={{
            cursor: "grab",
            padding: "0 8px",
            margin: "0",
            borderBottom: "1px solid #dcdcdc",
            zIndex: 10,
            backgroundColor: "white",
            textShadow: "1px 1px #fff",
          }}
        >
          <span style={{ marginLeft: "5px" }}>
            <span>
              {name}
              <Badge
                count={items.length ? items.length : 0}
                showZero={true}
                style={{
                  backgroundColor: "#eee",
                  color: "#777",
                  marginLeft: "6px",
                }}
              />
            </span>
          </span>
        </div>
        <div>
          <SortableContext items={items} strategy={verticalListSortingStrategy}>
            {items.map((item, _index) => {
              return (
                <Task
                  id={item}
                  key={item}
                  item={data.filter((d) => "task-" + d.id === item)[0]}
                  disabled={isSortingContainer}
                />
              );
            })}
          </SortableContext>
        </div>
      </div>
    </div>
  );
};

export default List;
