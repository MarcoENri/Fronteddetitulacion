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
  Tag,
  Popconfirm, // 1. Import nuevo agregado
} from "antd";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeftOutlined,
  BellOutlined,
  MailOutlined,
  UserAddOutlined,
  SolutionOutlined,
  EditOutlined,   // 1. Icono nuevo
  DeleteOutlined, // 1. Icono nuevo
} from "@ant-design/icons";

import {
  getStudentDetail,
  createIncident,
  createObservation,
  assignProject,
} from "../services/coordinatorStudentService";

// 1. Service nuevo
import { deleteIncident } from "../services/incidentManageService";

import type { StudentDetailDto } from "../services/coordinatorStudentService";
import { listTutorsForCoordinator } from "../services/coordinatorLookupService";
import type { UserOption } from "../services/adminLookupService";

import SendEmailModal from "../components/SendEmailModal";
// 1. Componente nuevo
import EditIncidentModal from "../components/EditIncidentModal";

import { getActiveAcademicPeriod } from "../services/periodService";

const { Title, Text } = Typography;
const VERDE_INSTITUCIONAL = "#008B8B";

type AssignForm = { projectName: string; tutorId: number };

export default function CoordinatorStudentDetailPage() {
  const nav = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [sp] = useSearchParams();

  // periodId inicial: query -> localStorage -> null
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
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);

  // 2. Estados nuevos para edición de incidencias
  const [editIncOpen, setEditIncOpen] = useState(false);
  const [editingIncident, setEditingIncident] = useState<any>(null);

  const [tutors, setTutors] = useState<UserOption[]>([]);
  const [assignForm] = Form.useForm<AssignForm>();
  const [incidentForm] = Form.useForm();
  const [obsForm] = Form.useForm();
  const [emailOpen, setEmailOpen] = useState(false);

  const load = async () => {
    if (!id) return;

    let pid = periodId;
    if (!pid) {
      const p = await getActiveAcademicPeriod();
      if (p?.id) {
        localStorage.setItem("periodId", String(p.id));
        pid = p.id;
      }
    }

    if (!pid) {
      message.warning("No hay período activo. Pide al administrador que lo active.");
      nav("/coordinator", { replace: true });
      return;
    }

    setLoading(true);
    try {
      const res = await getStudentDetail(id, pid);
      setData(res);
    } catch (e: any) {
      message.error(
        e?.response?.data?.message ?? "No se pudo cargar el estudiante"
      );
      nav("/coordinator", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, periodId]);

  const openAssignModal = async () => {
    const pid = periodId || Number(localStorage.getItem("periodId"));
    if (!pid) {
      message.warning("Falta periodId.");
      return;
    }

    try {
      const tuts = await listTutorsForCoordinator(pid as any);
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

  if (!data && loading) return <div style={{ padding: 50, textAlign: 'center' }}>Cargando...</div>;
  if (!data) return null;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f7f6" }}>
      <style>{`
        .header-container {
          background-color: ${VERDE_INSTITUCIONAL};
          padding: 10px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 4px solid #fff;
          flex-wrap: wrap;
          gap: 10px;
        }
        .banner-container {
          background-color: ${VERDE_INSTITUCIONAL};
          padding: 20px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 15px;
        }
        .text-responsive {
          font-size: clamp(14px, 4vw, 24px) !important;
        }
        @media (max-width: 576px) {
          .header-container { padding: 10px; justify-content: center; }
          .banner-container { flex-direction: column; text-align: center; }
        }
      `}</style>

      {/* HEADER */}
      <div className="header-container">
        <Space wrap>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => nav("/coordinator")}
            style={{
              borderRadius: "20px",
              fontWeight: "bold",
              color: VERDE_INSTITUCIONAL,
            }}
          >
            Volver al listado
          </Button>
          <Title
            level={4}
            style={{ margin: 0, color: "#fff" }}
            className="text-responsive"
          >
            Gestión de Estudiante
          </Title>
        </Space>

        <Space size="middle">
          <Popover
            content={<Empty description="No hay notificaciones" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
            title="Notificaciones"
            trigger="click"
          >
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
          style={{ borderRadius: "16px", overflow: "hidden", boxShadow: "0 8px 20px rgba(0,0,0,0.08)" }}
          styles={{ body: { padding: 0 } }}
        >
          <div className="banner-container">
            <Space align="start">
              <SolutionOutlined style={{ fontSize: "28px", color: "#fff", marginTop: "4px" }} />
              <div>
                <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: "11px", fontWeight: "bold", textTransform: "uppercase" }}>
                  Detalles del Alumno
                </Text>
                <Title level={3} style={{ margin: 0, color: "#fff" }} className="text-responsive">
                  {data.firstName} {data.lastName}
                </Title>
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
                      <Button
                        type="primary"
                        danger
                        disabled={data.incidentCount >= 3}
                        onClick={() => setIncidentOpen(true)}
                        style={{ marginBottom: 16, borderRadius: "6px" }}
                      >
                        Nueva incidencia
                      </Button>
                      
                      {/* 3. Tabla actualizada con acciones Editar/Eliminar */}
                      <Table
                        size="small"
                        rowKey="id"
                        dataSource={data.incidents}
                        scroll={{ x: true }}
                        columns={[
                          { title: "Etapa", dataIndex: "stage" },
                          { title: "Fecha", dataIndex: "date" },
                          { title: "Motivo", dataIndex: "reason" },
                          { title: "Acción", dataIndex: "action" },
                          {
                            title: "Acciones",
                            width: 120,
                            render: (_: any, inc: any) => {
                              const pid = periodId || Number(localStorage.getItem("periodId"));
                              return (
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
                                    description="Si quedan menos de 3 incidencias, el estudiante puede volver a EN_CURSO."
                                    okText="Eliminar"
                                    cancelText="Cancelar"
                                    onConfirm={async () => {
                                      if (!pid || !data?.id) return;
                                      try {
                                        const res = await deleteIncident(data.id, inc.id, pid);
                                        message.success(`Eliminada ✅ (Estado: ${res?.studentStatus ?? "OK"})`);
                                        load(); // recarga detalle
                                      } catch (e: any) {
                                        message.error(e?.response?.data?.message ?? "No se pudo eliminar");
                                      }
                                    }}
                                  >
                                    <Button size="small" danger icon={<DeleteOutlined />} />
                                  </Popconfirm>
                                </Space>
                              );
                            },
                          },
                        ]}
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
                      <Button
                        onClick={() => setObsOpen(true)}
                        style={{ marginBottom: 16, borderRadius: "6px", borderColor: VERDE_INSTITUCIONAL, color: VERDE_INSTITUCIONAL }}
                      >
                        Nueva observación
                      </Button>
                      <Table
                        size="small"
                        rowKey="id"
                        dataSource={data.observations}
                        scroll={{ x: true }}
                        columns={[
                          { title: "Autor", dataIndex: "author" },
                          { title: "Observación", dataIndex: "text" },
                          { title: "Fecha", dataIndex: "createdAt" },
                        ]}
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

      {/* MODAL ASIGNAR */}
      <Modal
        open={assignOpen}
        title="Asignar proyecto"
        confirmLoading={assignLoading}
        onCancel={() => setAssignOpen(false)}
        onOk={() => assignForm.submit()}
        destroyOnClose
      >
        <Form
          layout="vertical"
          form={assignForm}
          onFinish={async (v) => {
            const pid = periodId || Number(localStorage.getItem("periodId"));
            if (!id || !pid) return;
            setAssignLoading(true);
            try {
              await assignProject(id, pid, {
                projectName: v.projectName.trim(),
                tutorId: v.tutorId,
              });
              message.success("Asignado");
              setAssignOpen(false);
              load();
            } catch (e: any) {
              message.error(e?.response?.data?.message ?? "No se pudo asignar");
            } finally {
              setAssignLoading(false);
            }
          }}
        >
          <Form.Item name="projectName" label="Nombre del proyecto" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="tutorId" label="Tutor" rules={[{ required: true }]}>
            <Select
              options={tutors.map((u) => ({ value: u.id, label: u.fullName }))}
              placeholder="Selecciona un tutor"
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
        </Form>
      </Modal>

      <SendEmailModal
        open={emailOpen}
        studentId={data.id}
        studentEmail={data.email}
        onClose={() => setEmailOpen(false)}
      />

      {/* MODAL INCIDENCIA (CREAR) */}
      <Modal
        open={incidentOpen}
        title="Registrar incidencia"
        onCancel={() => setIncidentOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={incidentForm}
          layout="vertical"
          onFinish={async (v) => {
            const pid = periodId || Number(localStorage.getItem("periodId"));
            if (!id || !pid) return;
            try {
              await createIncident(id, pid, {
                stage: v.stage,
                date: v.date.format("YYYY-MM-DD"),
                reason: v.reason,
                action: v.action,
              });
              message.success("Incidencia registrada");
              setIncidentOpen(false);
              load();
            } catch (e: any) {
              message.error(e?.response?.data?.message ?? "Error al registrar");
            }
          }}
        >
          <Form.Item name="stage" label="Etapa" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="date" label="Fecha" rules={[{ required: true }]}><DatePicker style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="reason" label="Motivo" rules={[{ required: true }]}><Input.TextArea /></Form.Item>
          <Form.Item name="action" label="Acción" rules={[{ required: true }]}><Input.TextArea /></Form.Item>
          <Button htmlType="submit" type="primary" danger block>Guardar Incidencia</Button>
        </Form>
      </Modal>

      {/* MODAL OBSERVACIÓN */}
      <Modal
        open={obsOpen}
        title="Registrar observación"
        onCancel={() => setObsOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={obsForm}
          layout="vertical"
          onFinish={async (v) => {
            const pid = periodId || Number(localStorage.getItem("periodId"));
            if (!id || !pid) return;
            try {
              await createObservation(id, pid, { text: v.text });
              message.success("Observación registrada");
              setObsOpen(false);
              load();
            } catch (e: any) {
              message.error(e?.response?.data?.message ?? "Error al registrar");
            }
          }}
        >
          <Form.Item name="text" label="Observación" rules={[{ required: true }]}><Input.TextArea rows={4} /></Form.Item>
          <Button htmlType="submit" type="primary" block style={{ backgroundColor: VERDE_INSTITUCIONAL }}>Guardar Observación</Button>
        </Form>
      </Modal>

      {/* 4. MODAL EDITAR INCIDENCIA (Agregado al final) */}
      <EditIncidentModal
        open={editIncOpen}
        onClose={() => setEditIncOpen(false)}
        onSaved={load}
        periodId={(periodId || Number(localStorage.getItem("periodId")))!}
        studentId={data.id}
        incident={editingIncident}
      />
    </div>
  );
}