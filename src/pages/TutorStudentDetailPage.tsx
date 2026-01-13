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
  Typography
} from "antd";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  ArrowLeftOutlined, 
  MailOutlined, 
  FileSearchOutlined, 
  PlusOutlined 
} from "@ant-design/icons";

import {
  getTutorStudentDetail,
  createTutorIncident,
  createTutorObservation,
} from "../services/tutorService";

import type { StudentDetailDto } from "../services/tutorService";
import SendEmailModal from "../components/SendEmailModal";

const { Title, Text } = Typography;
const VERDE_INSTITUCIONAL = "#008B8B";

export default function TutorStudentDetailPage() {
  const nav = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [data, setData] = useState<StudentDetailDto | null>(null);
  const [loading, setLoading] = useState(false);

  const [incidentOpen, setIncidentOpen] = useState(false);
  const [obsOpen, setObsOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await getTutorStudentDetail(id);
      setData(res);
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? "No se pudo cargar el estudiante");
      nav("/tutor", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  if (!data) return null;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f7f6" }}>
      {/* HEADER SIN CAMPANA */}
      <div style={{ 
        backgroundColor: VERDE_INSTITUCIONAL, 
        padding: "0 24px", 
        height: "64px", 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        borderBottom: "4px solid #fff"
      }}>
        <Space>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => nav("/tutor")}
            style={{ borderRadius: "20px", fontWeight: "bold", color: VERDE_INSTITUCIONAL }}
          >
            Volver
          </Button>
          <Title level={4} style={{ margin: 0, color: "#fff" }}>Panel de Tutoría</Title>
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
          style={{ borderRadius: "16px", overflow: "hidden", border: "none", boxShadow: "0 8px 20px rgba(0,0,0,0.08)" }}
          bodyStyle={{ padding: 0 }}
        >
          {/* BANNER DE IDENTIDAD */}
          <div style={{ backgroundColor: VERDE_INSTITUCIONAL, padding: "20px 24px" }}>
            <Space align="start" size="middle">
              <FileSearchOutlined style={{ fontSize: "28px", color: "#fff", marginTop: "4px" }} />
              <div>
                <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: "11px", fontWeight: "bold", textTransform: "uppercase" }}>Seguimiento Académico</Text>
                <Title level={3} style={{ margin: 0, color: "#fff" }}>{data.firstName} {data.lastName}</Title>
              </div>
            </Space>
          </div>

          <div style={{ padding: "24px" }}>
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label={<Text strong style={{ color: VERDE_INSTITUCIONAL }}>Estudiante</Text>}>
                {data.firstName} {data.lastName}
              </Descriptions.Item>
              <Descriptions.Item label={<Text strong style={{ color: VERDE_INSTITUCIONAL }}>Email</Text>}>
                {data.email}
              </Descriptions.Item>
              <Descriptions.Item label={<Text strong style={{ color: VERDE_INSTITUCIONAL }}>Carrera</Text>}>
                {data.career}
              </Descriptions.Item>
              <Descriptions.Item label={<Text strong style={{ color: VERDE_INSTITUCIONAL }}>Estado</Text>}>
                <Tag color="blue">{data.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label={<Text strong style={{ color: VERDE_INSTITUCIONAL }}>Proyecto</Text>} span={2}>
                {data.thesisProject ?? <Text type="secondary" italic>No definido</Text>}
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
                    <div style={{ padding: "16px", backgroundColor: "#fff", borderRadius: "0 0 8px 8px", border: "1px solid #f0f0f0", borderTop: "none" }}>
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
                        ]}
                      />
                    </div>
                  ),
                },
                {
                  key: "obs",
                  label: `Observaciones (${data.observationCount})`,
                  children: (
                    <div style={{ padding: "16px", backgroundColor: "#fff", borderRadius: "0 0 8px 8px", border: "1px solid #f0f0f0", borderTop: "none" }}>
                      <Button 
                        icon={<PlusOutlined />}
                        onClick={() => setObsOpen(true)}
                        style={{ marginBottom: 16, borderRadius: "6px", borderColor: VERDE_INSTITUCIONAL, color: VERDE_INSTITUCIONAL }}
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

      {/* MODALES CON LÓGICA ORIGINAL */}
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
          <Form.Item name="stage" label="Etapa" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="date" label="Fecha" rules={[{ required: true }]}><DatePicker style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="reason" label="Motivo" rules={[{ required: true }]}><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="action" label="Acción" rules={[{ required: true }]}><Input.TextArea rows={3} /></Form.Item>

          <Space style={{ width: "100%", justifyContent: "flex-end" }}>
            <Button onClick={() => setIncidentOpen(false)}>Cancelar</Button>
            <Button htmlType="submit" type="primary" danger>Guardar</Button>
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
          <Form.Item name="text" label="Observación" rules={[{ required: true }]}><Input.TextArea rows={4} /></Form.Item>

          <Space style={{ width: "100%", justifyContent: "flex-end" }}>
            <Button onClick={() => setObsOpen(false)}>Cancelar</Button>
            <Button htmlType="submit" type="primary" style={{ backgroundColor: VERDE_INSTITUCIONAL }}>Guardar</Button>
          </Space>
        </Form>
      </Modal>
    </div>
  );
}