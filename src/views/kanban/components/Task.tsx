import React from "react";
import {
  PriorityBacklogOutlined,
  PriorityNormalOutlined,
  PriorityHighOutlined,
  PriorityUrgentOutlined,
} from "./customIcon";
import { MessageOutlined } from "@ant-design/icons";
import { useSortable } from "@dnd-kit/sortable";
import { Card, Row, Col, Space } from "antd";
import { CSS } from "@dnd-kit/utilities";
import { UniqueIdentifier } from "@dnd-kit/core";

const getPriorityIconByID = (id: number) => {
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

type Props = {
  id: UniqueIdentifier;
  item: any;
  dragOverlay?: boolean;
  disabled?: boolean;
};

const Task = (props: Props) => {
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

export default Task;
