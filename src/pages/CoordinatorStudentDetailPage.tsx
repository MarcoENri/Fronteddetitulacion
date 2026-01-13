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
  Select,
  Space,
  Typography,
  Badge,
  Popover,
  Empty,
  Tag
} from "antd";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  ArrowLeftOutlined, 
  BellOutlined, 
  MailOutlined, 
  UserAddOutlined, 
  SolutionOutlined 
} from "@ant-design/icons";

import {
  getStudentDetail,
  createIncident,
  createObservation,
  assignProject,
} from "../services/coordinatorStudentService";

import type { StudentDetailDto } from "../services/coordinatorStudentService";
import { listTutorsForCoordinator } from "../services/coordinatorLookupService";
import type { UserOption } from "../services/adminLookupService";

import SendEmailModal from "../components/SendEmailModal";

const { Title, Text } = Typography;
const VERDE_INSTITUCIONAL = "#008B8B";

type AssignForm = { projectName: string; tutorId: number };

export default function CoordinatorStudentDetailPage() {
  const nav = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [data, setData] = useState<StudentDetailDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [incidentOpen, setIncidentOpen] = useState(false);
  const [obsOpen, setObsOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [tutors, setTutors] = useState<UserOption[]>([]);
  const [assignForm] = Form.useForm<AssignForm>();
  const [incidentForm] = Form.useForm();
  const [obsForm] = Form.useForm();
  const [emailOpen, setEmailOpen] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await getStudentDetail(id);
      setData(res);
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? "No se pudo cargar el estudiante");
      nav("/coordinator", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const openAssignModal = async () => {
    try {
      const tuts = await listTutorsForCoordinator();
      setTutors(tuts);
      assignForm.setFieldsValue({
        projectName: data?.thesisProject ?? "",
        tutorId: (data?.tutorId ?? undefined) as any,
      });
      setAssignOpen(true);
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? "No se pudo cargar tutores");
    }
  };

  if (!data) return null;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f7f6" }}>
      {/* CSS para que el texto no se monte en iPhone/iPad */}
      <style>{`
        .header-container {
          background-color: ${VERDE_INSTITUCIONAL};
          padding: 10px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 4px solid #fff;
          flex-wrap: wrap; /* Esto hace que los botones bajen si no caben */
          gap: 10px;
        }
        .banner-container {
          background-color: ${VERDE_INSTITUCIONAL};
          padding: 20px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap; /* Evita que el botón de asignar se monte sobre el nombre */
          gap: 15px;
        }
        .text-responsive {
          font-size: clamp(14px, 4vw, 24px) !important; /* Ajusta el tamaño de letra según la pantalla */
        }
        @media (max-width: 576px) {
          .header-container { padding: 10px; justify-content: center; }
          .banner-container { flex-direction: column; text-align: center; }
          .ant-descriptions-item-label { width: 30% !important; }
        }
      `}</style>

      {/* HEADER DE DETALLE */}
      <div className="header-container">
        <Space wrap>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => nav("/coordinator")}
            style={{ borderRadius: "20px", fontWeight: "bold", color: VERDE_INSTITUCIONAL }}
          >
            Volver al listado
          </Button>
          <Title level={4} style={{ margin: 0, color: "#fff" }} className="text-responsive">Gestión de Estudiante</Title>
        </Space>
        <Space size="middle">
          <Popover content={<Empty description="No hay notificaciones" image={Empty.PRESENTED_IMAGE_SIMPLE} />} title="Notificaciones" trigger="click">
            <Badge count={0} size="small">
              <BellOutlined style={{ fontSize: "20px", color: "white", cursor: "pointer" }} />
            </Badge>
          </Popover>
          <Button 
            icon={<MailOutlined />} 
            onClick={() => setEmailOpen(true)}
            style={{ borderRadius: "20px", fontWeight: "bold" }}
          >
            Enviar Correo
          </Button>
        </Space>
      </div>

      <div style={{ padding: "clamp(12px, 3vw, 24px)", maxWidth: "1100px", margin: "0 auto" }}>
        <Card 
          loading={loading}
          style={{ borderRadius: "16px", overflow: "hidden", border: "none", boxShadow: "0 8px 20px rgba(0,0,0,0.08)" }}
          styles={{ body: { padding: 0 } }}
        >
          <div className="banner-container">
            <Space align="start">
              <SolutionOutlined style={{ fontSize: "28px", color: "#fff", marginTop: "4px" }} />
              <div>
                <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: "11px", fontWeight: "bold", textTransform: "uppercase" }}>Detalles del Alumno</Text>
                <Title level={3} style={{ margin: 0, color: "#fff" }} className="text-responsive">{data.firstName} {data.lastName}</Title>
              </div>
            </Space>
            <Button 
              type="default" 
              icon={<UserAddOutlined />} 
              onClick={openAssignModal}
              style={{ borderRadius: "8px", fontWeight: "bold", height: "40px" }}
            >
              Asignar Proyecto y Tutor
            </Button>
          </div>

          <div style={{ padding: "20px" }}>
            <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }}>
              <Descriptions.Item label={<Text strong style={{ color: VERDE_INSTITUCIONAL }}>Email</Text>}>
                <span style={{ wordBreak: "break-all" }}>{data.email}</span>
              </Descriptions.Item>
              <Descriptions.Item label={<Text strong style={{ color: VERDE_INSTITUCIONAL }}>Carrera</Text>}>
                {data.career}
              </Descriptions.Item>
              <Descriptions.Item label={<Text strong style={{ color: VERDE_INSTITUCIONAL }}>Estado</Text>}>
                <Tag color="cyan">{data.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label={<Text strong style={{ color: VERDE_INSTITUCIONAL }}>Proyecto</Text>}>
                {data.thesisProject ?? <Text type="secondary" italic>No asignado</Text>}
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
                    <div style={{ padding: "16px", backgroundColor: "#fff", borderRadius: "8px", border: "1px solid #f0f0f0" }}>
                      <Button type="primary" danger disabled={data.incidentCount >= 3} onClick={() => setIncidentOpen(true)} style={{ marginBottom: 16, borderRadius: "6px" }}>
                        Nueva incidencia
                      </Button>
                      <Table size="small" rowKey="id" dataSource={data.incidents} scroll={{ x: true }}
                        columns={[{ title: "Etapa", dataIndex: "stage" }, { title: "Fecha", dataIndex: "date" }, { title: "Motivo", dataIndex: "reason" }, { title: "Acción", dataIndex: "action" }]}
                        pagination={false}
                      />
                    </div>
                  ),
                },
                {
                  key: "obs",
                  label: `Observaciones (${data.observationCount})`,
                  children: (
                    <div style={{ padding: "16px", backgroundColor: "#fff", borderRadius: "8px", border: "1px solid #f0f0f0" }}>
                      <Button onClick={() => setObsOpen(true)} style={{ marginBottom: 16, borderRadius: "6px", borderColor: VERDE_INSTITUCIONAL, color: VERDE_INSTITUCIONAL }}>
                        Nueva observación
                      </Button>
                      <Table size="small" rowKey="id" dataSource={data.observations} scroll={{ x: true }}
                        columns={[{ title: "Autor", dataIndex: "author" }, { title: "Observación", dataIndex: "text" }, { title: "Fecha", dataIndex: "createdAt" }]}
                        pagination={false}
                      />
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </Card>
      </div>

      <Modal open={assignOpen} title="Asignar proyecto" confirmLoading={assignLoading} onCancel={() => setAssignOpen(false)} onOk={() => assignForm.submit()}>
        <Form layout="vertical" form={assignForm} onFinish={async (v) => {
            await assignProject(id!, { projectName: v.projectName.trim(), tutorId: v.tutorId });
            message.success("Asignado");
            setAssignOpen(false);
            load();
        }}>
          <Form.Item name="projectName" label="Nombre del proyecto" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="tutorId" label="Tutor" rules={[{ required: true }]}><Select options={tutors.map(u => ({ value: u.id, label: u.fullName }))} /></Form.Item>
        </Form>
      </Modal>

      <SendEmailModal open={emailOpen} studentId={data.id} studentEmail={data.email} onClose={() => setEmailOpen(false)} />

      <Modal open={incidentOpen} title="Registrar incidencia" onCancel={() => setIncidentOpen(false)} footer={null}>
        <Form form={incidentForm} layout="vertical" onFinish={async (v) => {
            await createIncident(id!, { stage: v.stage, date: v.date.format("YYYY-MM-DD"), reason: v.reason, action: v.action });
            setIncidentOpen(false); load();
        }}>
          <Form.Item name="stage" label="Etapa" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="date" label="Fecha" rules={[{ required: true }]}><DatePicker style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="reason" label="Motivo" rules={[{ required: true }]}><Input.TextArea /></Form.Item>
          <Form.Item name="action" label="Acción" rules={[{ required: true }]}><Input.TextArea /></Form.Item>
          <Button htmlType="submit" type="primary" danger block>Guardar Incidencia</Button>
        </Form>
      </Modal>

      <Modal open={obsOpen} title="Registrar observación" onCancel={() => setObsOpen(false)} footer={null}>
        <Form form={obsForm} layout="vertical" onFinish={async (v) => {
            await createObservation(id!, { text: v.text });
            setObsOpen(false); load();
        }}>
          <Form.Item name="text" label="Observación" rules={[{ required: true }]}><Input.TextArea rows={4} /></Form.Item>
          <Button htmlType="submit" type="primary" block style={{ backgroundColor: VERDE_INSTITUCIONAL }}>Guardar Observación</Button>
        </Form>
      </Modal>
    </div>
  );
}