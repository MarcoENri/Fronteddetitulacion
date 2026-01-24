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
  Typography,
  Popconfirm, // 1. Import nuevo
} from "antd";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeftOutlined,
  MailOutlined,
  FileSearchOutlined,
  PlusOutlined,
  EditOutlined,   // 1. Icono nuevo
  DeleteOutlined, // 1. Icono nuevo
} from "@ant-design/icons";

import {
  getTutorStudentDetail,
  createTutorIncident,
  createTutorObservation,
} from "../services/tutorService";

// 1. Service nuevo
import { deleteIncident } from "../services/incidentManageService";
import type { StudentDetailDto } from "../services/tutorService";
import SendEmailModal from "../components/SendEmailModal";
// 1. Componente nuevo
import EditIncidentModal from "../components/EditIncidentModal";

const { Title, Text } = Typography;
const VERDE_INSTITUCIONAL = "#008B8B";

export default function TutorStudentDetailPage() {
  const nav = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [sp] = useSearchParams();

  // ✅ periodId: primero query ?periodId=, si no, localStorage
  const periodId = useMemo(() => {
    const q = sp.get("periodId");
    if (q && !Number.isNaN(Number(q))) return Number(q);

    const ls = localStorage.getItem("periodId");
    if (ls && !Number.isNaN(Number(ls))) return Number(ls);

    return null;
  }, [sp]);

  const [data, setData] = useState<StudentDetailDto | null>(null);
  const [loading, setLoading] = useState(false);

  const [incidentOpen, setIncidentOpen] = useState(false);
  const [obsOpen, setObsOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);

  // 2. Estados nuevos para edición/borrado
  const [editIncOpen, setEditIncOpen] = useState(false);
  const [editingIncident, setEditingIncident] = useState<any>(null);

  const load = async () => {
    if (!id) return;

    if (!periodId) {
      message.warning("Falta periodId. Regresando al listado...");
      nav("/tutor", { replace: true });
      return;
    }

    setLoading(true);
    try {
      const res = await getTutorStudentDetail(id, periodId);
      setData(res);
    } catch (e: any) {
      message.error(
        e?.response?.data?.message ?? "No se pudo cargar el estudiante"
      );
      nav("/tutor", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, periodId]);

  if (!data) return null;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f7f6" }}>
      {/* HEADER SIN CAMPANA */}
      <div
        style={{
          backgroundColor: VERDE_INSTITUCIONAL,
          padding: "0 24px",
          height: "64px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "4px solid #fff",
        }}
      >
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => nav("/tutor")}
            style={{
              borderRadius: "20px",
              fontWeight: "bold",
              color: VERDE_INSTITUCIONAL,
            }}
          >
            Volver
          </Button>
          <Title level={4} style={{ margin: 0, color: "#fff" }}>
            Panel de Tutoría
          </Title>
        </Space>

        <Button
          icon={<MailOutlined />}
          onClick={() => setEmailOpen(true)}
          style={{ borderRadius: "20px", fontWeight: "bold" }}
        >
          Enviar Correo
        </Button>
      </div>

      <div style={{ padding: "24px", maxWidth: "1100px", margin: "0 auto" }}>
        <Card
          loading={loading}
          style={{
            borderRadius: "16px",
            overflow: "hidden",
            border: "none",
            boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
          }}
          bodyStyle={{ padding: 0 }}
        >
          {/* BANNER DE IDENTIDAD */}
          <div
            style={{
              backgroundColor: VERDE_INSTITUCIONAL,
              padding: "20px 24px",
            }}
          >
            <Space align="start" size="middle">
              <FileSearchOutlined
                style={{
                  fontSize: "28px",
                  color: "#fff",
                  marginTop: "4px",
                }}
              />
              <div>
                <Text
                  style={{
                    color: "rgba(255,255,255,0.8)",
                    fontSize: "11px",
                    fontWeight: "bold",
                    textTransform: "uppercase",
                  }}
                >
                  Seguimiento Académico
                </Text>
                <Title level={3} style={{ margin: 0, color: "#fff" }}>
                  {data.firstName} {data.lastName}
                </Title>
              </div>
            </Space>
          </div>

          <div style={{ padding: "24px" }}>
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item
                label={
                  <Text strong style={{ color: VERDE_INSTITUCIONAL }}>
                    Estudiante
                  </Text>
                }
              >
                {data.firstName} {data.lastName}
              </Descriptions.Item>

              <Descriptions.Item
                label={
                  <Text strong style={{ color: VERDE_INSTITUCIONAL }}>
                    Email
                  </Text>
                }
              >
                {data.email}
              </Descriptions.Item>

              <Descriptions.Item
                label={
                  <Text strong style={{ color: VERDE_INSTITUCIONAL }}>
                    Carrera
                  </Text>
                }
              >
                {data.career}
              </Descriptions.Item>

              <Descriptions.Item
                label={
                  <Text strong style={{ color: VERDE_INSTITUCIONAL }}>
                    Estado
                  </Text>
                }
              >
                <Tag color="blue">{data.status}</Tag>
              </Descriptions.Item>

              <Descriptions.Item
                label={
                  <Text strong style={{ color: VERDE_INSTITUCIONAL }}>
                    Proyecto
                  </Text>
                }
                span={2}
              >
                {data.thesisProject ?? (
                  <Text type="secondary" italic>
                    No definido
                  </Text>
                )}
              </Descriptions.Item>
            </Descriptions>

            <Tabs
              style={{ marginTop: 24 }}
              type="card"
              items={[
                {
                  key: "inc",
                  label: `Incidencias (${data.incidentCount})`,
                  children: (
                    <div
                      style={{
                        padding: "16px",
                        backgroundColor: "#fff",
                        borderRadius: "0 0 8px 8px",
                        border: "1px solid #f0f0f0",
                        borderTop: "none",
                      }}
                    >
                      <Button
                        type="primary"
                        danger
                        icon={<PlusOutlined />}
                        disabled={data.incidentCount >= 3}
                        onClick={() => setIncidentOpen(true)}
                        style={{ marginBottom: 16, borderRadius: "6px" }}
                      >
                        Nueva incidencia
                      </Button>

                      {/* 3. Tabla actualizada con columna Acciones */}
                      <Table
                        size="small"
                        rowKey="id"
                        dataSource={data.incidents}
                        pagination={false}
                        columns={[
                          { title: "Etapa", dataIndex: "stage" },
                          { title: "Fecha", dataIndex: "date" },
                          { title: "Motivo", dataIndex: "reason" },
                          { title: "Acción", dataIndex: "action" },
                          {
                            title: "Acciones",
                            width: 120,
                            render: (_: any, inc: any) => (
                              <Space>
                                <Button
                                  size="small"
                                  icon={<EditOutlined />}
                                  onClick={() => {
                                    setEditingIncident(inc);
                                    setEditIncOpen(true);
                                  }}
                                />
                                <Popconfirm
                                  title="¿Eliminar incidencia?"
                                  okText="Eliminar"
                                  cancelText="Cancelar"
                                  onConfirm={async () => {
                                    if (!periodId || !data?.id) return;
                                    try {
                                      const res = await deleteIncident(data.id, inc.id, periodId);
                                      message.success(`Eliminada ✅ (Estado: ${res?.studentStatus ?? "OK"})`);
                                      load();
                                    } catch (e: any) {
                                      message.error(e?.response?.data?.message ?? "No se pudo eliminar");
                                    }
                                  }}
                                >
                                  <Button size="small" danger icon={<DeleteOutlined />} />
                                </Popconfirm>
                              </Space>
                            ),
                          },
                        ]}
                      />
                    </div>
                  ),
                },
                {
                  key: "obs",
                  label: `Observaciones (${data.observationCount})`,
                  children: (
                    <div
                      style={{
                        padding: "16px",
                        backgroundColor: "#fff",
                        borderRadius: "0 0 8px 8px",
                        border: "1px solid #f0f0f0",
                        borderTop: "none",
                      }}
                    >
                      <Button
                        icon={<PlusOutlined />}
                        onClick={() => setObsOpen(true)}
                        style={{
                          marginBottom: 16,
                          borderRadius: "6px",
                          borderColor: VERDE_INSTITUCIONAL,
                          color: VERDE_INSTITUCIONAL,
                        }}
                      >
                        Nueva observación
                      </Button>

                      <Table
                        size="small"
                        rowKey="id"
                        dataSource={data.observations}
                        pagination={false}
                        columns={[
                          { title: "Autor", dataIndex: "author" },
                          { title: "Observación", dataIndex: "text" },
                          { title: "Fecha", dataIndex: "createdAt" },
                        ]}
                      />
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </Card>
      </div>

      {/* MODALES */}
      <SendEmailModal
        open={emailOpen}
        studentId={data.id}
        studentEmail={data.email}
        onClose={() => setEmailOpen(false)}
      />

      <Modal
        open={incidentOpen}
        title={<Text strong>Registrar incidencia</Text>}
        onCancel={() => setIncidentOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          layout="vertical"
          onFinish={async (v) => {
            if (!id || !periodId) return;
            try {
              await createTutorIncident(id, periodId, {
                stage: v.stage,
                date: v.date.format("YYYY-MM-DD"),
                reason: v.reason,
                action: v.action,
              });
              message.success("Incidencia registrada");
              setIncidentOpen(false);
              load();
            } catch (e: any) {
              message.error(
                e?.response?.data?.message ?? "No se pudo registrar incidencia"
              );
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
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item name="action" label="Acción" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>

          <Space style={{ width: "100%", justifyContent: "flex-end" }}>
            <Button onClick={() => setIncidentOpen(false)}>Cancelar</Button>
            <Button htmlType="submit" type="primary" danger>
              Guardar
            </Button>
          </Space>
        </Form>
      </Modal>

      <Modal
        open={obsOpen}
        title={<Text strong>Registrar observación</Text>}
        onCancel={() => setObsOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          layout="vertical"
          onFinish={async (v) => {
            if (!id || !periodId) return;
            try {
              await createTutorObservation(id, periodId, { text: v.text });
              message.success("Observación registrada");
              setObsOpen(false);
              load();
            } catch (e: any) {
              message.error(
                e?.response?.data?.message ?? "No se pudo registrar observación"
              );
            }
          }}
        >
          <Form.Item name="text" label="Observación" rules={[{ required: true }]}>
            <Input.TextArea rows={4} />
          </Form.Item>

          <Space style={{ width: "100%", justifyContent: "flex-end" }}>
            <Button onClick={() => setObsOpen(false)}>Cancelar</Button>
            <Button
              htmlType="submit"
              type="primary"
              style={{ backgroundColor: VERDE_INSTITUCIONAL }}
            >
              Guardar
            </Button>
          </Space>
        </Form>
      </Modal>

      {/* 4. MODAL EDITAR INCIDENCIA (Agregado al final) */}
      <EditIncidentModal
        open={editIncOpen}
        onClose={() => setEditIncOpen(false)}
        onSaved={load}
        periodId={periodId!}
        studentId={data.id}
        incident={editingIncident}
      />
    </div>
  );
}