//@ts-nocheck
import React from "react";
import {
  useSortable,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, Row, Col, Badge, Space } from "antd";
import { MessageOutlined } from "@ant-design/icons";
import {
  PriorityBacklogOutlined,
  PriorityHighOutlined,
  PriorityNormalOutlined,
  PriorityUrgentOutlined,
} from "./customIcon";

// Column
export const SectionItem = (props) => {
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

  const style = {
    transform: CSS.Translate.toString(transform),
    cursor: dragOverlay ? "grabbing" : "grab",
    transition,
    display: "flex",
    flexDirection: "column",
  };
  const tasksContainer = {
    display: "flex",
    flexDirection: "column",
    padding: "6px 8px",
    overflowY: "auto",
    height: "100%",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
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
          // backgroundColor: isDragging ? '#FEFEFE' : 'white',
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
          <SortableContext
            items={items}
            strategy={verticalListSortingStrategy} // verticalListSortingStrategy rectSortingStrategy
          >
            {items.map((item, _index) => {
              return (
                <FieldItem
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

const getPriorityIconByID = (id) => {
  let icon;
  switch (id) {
    case 1:
      icon = <PriorityBacklogOutlined />;
      break;
    case 2:
      icon = <PriorityNormalOutlined />;
      break;
    case 3:
      icon = <PriorityHighOutlined />;
      break;
    case 4:
      icon = <PriorityUrgentOutlined />;
      break;
    default:
      icon = <PriorityBacklogOutlined />;
      break;
  }
  return icon;
};

// Task
export const FieldItem = (props) => {
  const { id, item, dragOverlay } = props;
  const {
    setNodeRef,
    //setActivatorNodeRef,
    listeners,
    isDragging,
    //isSorting,
    //over,
    //overIndex,
    transform,
    transition,
    attributes,
  } = useSortable({
    id: id,
    disabled: props.disabled,
    data: {
      type: "FIELD",
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };
  return (
    <div
      ref={props.disabled ? null : setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <Card
        className="my-3 w-52 bg-green-300 p-0"
        style={{
          boxShadow: dragOverlay
            ? "0 0 0 calc(1px / 1) rgba(63, 63, 68, 0.05), -1px 0 15px 0 rgba(34, 33, 81, 0.01), 0px 15px 15px 0 rgba(34, 33, 81, 0.25)"
            : "",
          mixBlendMode: dragOverlay ? "revert" : "normal",
          border: dragOverlay
            ? "1px solid rgba(64, 150, 255, 1)"
            : "1px solid #dcdcdc", // 1px solid rgba(64, 150, 255, 1)
          opacity: isDragging ? 0.5 : 1,
          // backgroundColor: isDragging ? '#FEFEFE' : 'white',
          cursor: dragOverlay ? "grabbing" : "grab",
          transform: dragOverlay
            ? "rotate(-2deg) scale(1.05)"
            : "rotate(0deg) scale(1.0)",
        }}
        //bordered={false}
        size="small"
      >
        <Row justify="space-between">
          <Col span={20}>{item.name}</Col>
        </Row>
        <Row justify="space-between">
          <Col>
            {item.comments_count && (
              <Space
                align="center"
                style={{
                  cursor: "pointer",
                }}
              >
                <MessageOutlined />
                {item.comments_count}
              </Space>
            )}
          </Col>
          <Col>
            <Space align="center">
              {getPriorityIconByID(item.priority_id)}
            </Space>
          </Col>
        </Row>
      </Card>
    </div>
  );
};
