import { Card, Descriptions, Tabs, Table, Button, Modal, Form, Input, DatePicker, message } from "antd";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import {
  getStudentDetail,
  createIncident,
  createObservation
} from "../services/coordinatorStudentService";

import type { StudentDetailDto } 
  from "../services/coordinatorStudentService";


export default function CoordinatorStudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<StudentDetailDto | null>(null);
  const [loading, setLoading] = useState(false);

  const [incidentOpen, setIncidentOpen] = useState(false);
  const [obsOpen, setObsOpen] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const res = await getStudentDetail(id);
    setData(res.data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [id]);

  if (!data) return null;

  return (
    <Card loading={loading} title="Detalle del estudiante">
      <Descriptions bordered size="small" column={2}>
        <Descriptions.Item label="Estudiante">
          {data.firstName} {data.lastName}
        </Descriptions.Item>
        <Descriptions.Item label="Carrera">{data.career}</Descriptions.Item>
        <Descriptions.Item label="Estado">{data.status}</Descriptions.Item>
        <Descriptions.Item label="Proyecto">{data.thesisProject ?? "-"}</Descriptions.Item>
      </Descriptions>

      <Tabs
        style={{ marginTop: 16 }}
        items={[
          {
            key: "inc",
            label: `Incidencias (${data.incidentCount})`,
            children: (
              <>
                <Button
                  type="primary"
                  danger
                  disabled={data.incidentCount >= 3}
                  onClick={() => setIncidentOpen(true)}
                >
                  Nueva incidencia
                </Button>

                <Table
                  rowKey="id"
                  dataSource={data.incidents}
                  columns={[
                    { title: "Etapa", dataIndex: "stage" },
                    { title: "Fecha", dataIndex: "date" },
                    { title: "Motivo", dataIndex: "reason" },
                    { title: "Acción", dataIndex: "action" },
                  ]}
                />
              </>
            ),
          },
          {
            key: "obs",
            label: `Observaciones (${data.observationCount})`,
            children: (
              <>
                <Button onClick={() => setObsOpen(true)}>
                  Nueva observación
                </Button>

                <Table
                  rowKey="id"
                  dataSource={data.observations}
                  columns={[
                    { title: "Autor", dataIndex: "author" },
                    { title: "Observación", dataIndex: "text" },
                    { title: "Fecha", dataIndex: "createdAt" },
                  ]}
                />
              </>
            ),
          },
        ]}
      />

      {/* ---------- MODAL INCIDENCIA ---------- */}
      <Modal
        open={incidentOpen}
        title="Registrar incidencia"
        onCancel={() => setIncidentOpen(false)}
        footer={null}
      >
        <Form
          onFinish={async (v) => {
            await createIncident(id!, {
              stage: v.stage,
              date: v.date.format("YYYY-MM-DD"),
              reason: v.reason,
              action: v.action,
            });
            message.success("Incidencia registrada");
            setIncidentOpen(false);
            load();
          }}
        >
          <Form.Item name="stage" label="Etapa" required>
            <Input />
          </Form.Item>
          <Form.Item name="date" label="Fecha" required>
            <DatePicker />
          </Form.Item>
          <Form.Item name="reason" label="Motivo" required>
            <Input.TextArea />
          </Form.Item>
          <Form.Item name="action" label="Acción" required>
            <Input.TextArea />
          </Form.Item>
          <Button htmlType="submit" type="primary" danger>
            Guardar
          </Button>
        </Form>
      </Modal>

      {/* ---------- MODAL OBSERVACIÓN ---------- */}
      <Modal
        open={obsOpen}
        title="Registrar observación"
        onCancel={() => setObsOpen(false)}
        footer={null}
      >
        <Form
          onFinish={async (v) => {
            await createObservation(id!, { text: v.text });
            message.success("Observación registrada");
            setObsOpen(false);
            load();
          }}
        >
          <Form.Item name="text" label="Observación" required>
            <Input.TextArea />
          </Form.Item>
          <Button htmlType="submit" type="primary">
            Guardar
          </Button>
        </Form>
      </Modal>
    </Card>
  );
}
