import {
  Card,
  Descriptions,
  Tabs,
  Table,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  message,
  Space,
  Tag,
} from "antd";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getTutorStudentDetail,
  createTutorIncident,
  createTutorObservation,
} from "../services/tutorService";

import type { StudentDetailDto } from "../services/tutorService";

// ✅ NUEVO
import SendEmailModal from "../components/SendEmailModal";

export default function TutorStudentDetailPage() {
  const nav = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [data, setData] = useState<StudentDetailDto | null>(null);
  const [loading, setLoading] = useState(false);

  const [incidentOpen, setIncidentOpen] = useState(false);
  const [obsOpen, setObsOpen] = useState(false);

  // ✅ NUEVO: modal email
  const [emailOpen, setEmailOpen] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await getTutorStudentDetail(id);
      setData(res);
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? "No se pudo cargar el estudiante");
      // ✅ si falla, vuelve a la lista del tutor
      nav("/tutor", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!data) return null;

  return (
    <div style={{ padding: 16, maxWidth: 1200, margin: "0 auto" }}>
      <Space style={{ width: "100%", justifyContent: "space-between", marginBottom: 12 }}>
        <Space>
          <Button onClick={() => nav("/tutor")}>← Volver a la lista</Button>

          {/* ✅ NUEVO */}
          <Button onClick={() => setEmailOpen(true)}>Enviar correo</Button>
        </Space>
      </Space>

      <Card loading={loading} title="Detalle del estudiante (Tutor)">
        <Descriptions bordered size="small" column={2}>
          <Descriptions.Item label="Estudiante">
            {data.firstName} {data.lastName}
          </Descriptions.Item>
          <Descriptions.Item label="Email">{data.email}</Descriptions.Item>
          <Descriptions.Item label="Carrera">{data.career}</Descriptions.Item>
          <Descriptions.Item label="Estado">
            <Tag>{data.status}</Tag>
          </Descriptions.Item>
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
                    style={{ marginTop: 12 }}
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
                  <Button onClick={() => setObsOpen(true)}>Nueva observación</Button>

                  <Table
                    style={{ marginTop: 12 }}
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

        {/* ✅ NUEVO: MODAL EMAIL */}
        <SendEmailModal
          open={emailOpen}
          studentId={data.id}
          studentEmail={data.email}
          onClose={() => setEmailOpen(false)}
        />

        {/* ---------- MODAL INCIDENCIA ---------- */}
        <Modal
          open={incidentOpen}
          title="Registrar incidencia"
          onCancel={() => setIncidentOpen(false)}
          footer={null}
          destroyOnClose
        >
          <Form
            layout="vertical"
            onFinish={async (v) => {
              try {
                await createTutorIncident(id!, {
                  stage: v.stage,
                  date: v.date.format("YYYY-MM-DD"),
                  reason: v.reason,
                  action: v.action,
                });
                message.success("Incidencia registrada");
                setIncidentOpen(false);
                load();
              } catch (e: any) {
                message.error(e?.response?.data?.message ?? "No se pudo registrar incidencia");
              }
            }}
          >
            <Form.Item name="stage" label="Etapa" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="date" label="Fecha" rules={[{ required: true }]}>
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="reason" label="Motivo" rules={[{ required: true }]}>
              <Input.TextArea />
            </Form.Item>
            <Form.Item name="action" label="Acción" rules={[{ required: true }]}>
              <Input.TextArea />
            </Form.Item>

            <Space>
              <Button onClick={() => setIncidentOpen(false)}>Cancelar</Button>
              <Button htmlType="submit" type="primary" danger>
                Guardar
              </Button>
            </Space>
          </Form>
        </Modal>

        {/* ---------- MODAL OBSERVACIÓN ---------- */}
        <Modal
          open={obsOpen}
          title="Registrar observación"
          onCancel={() => setObsOpen(false)}
          footer={null}
          destroyOnClose
        >
          <Form
            layout="vertical"
            onFinish={async (v) => {
              try {
                await createTutorObservation(id!, { text: v.text });
                message.success("Observación registrada");
                setObsOpen(false);
                load();
              } catch (e: any) {
                message.error(e?.response?.data?.message ?? "No se pudo registrar observación");
              }
            }}
          >
            <Form.Item name="text" label="Observación" rules={[{ required: true }]}>
              <Input.TextArea />
            </Form.Item>

            <Space>
              <Button onClick={() => setObsOpen(false)}>Cancelar</Button>
              <Button htmlType="submit" type="primary">
                Guardar
              </Button>
            </Space>
          </Form>
        </Modal>
      </Card>
    </div>
  );
}
