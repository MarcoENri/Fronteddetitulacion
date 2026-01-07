import { Card, Descriptions, Table, Tabs, Button, message, Space } from "antd";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/api";

// ✅ NUEVO
import SendEmailModal from "../components/SendEmailModal";

type IncidentDto = {
  id: number;
  stage: string;
  date: string;
  reason: string;
  action: string;
  createdAt: string;
  createdByUserId?: number | null;
};

type ObservationDto = {
  id: number;
  author: string;
  text: string;
  createdAt: string;
  authorUserId?: number | null;
};

type StudentDetailDto = {
  id: number;
  dni: string;
  firstName: string;
  lastName: string;
  email: string;
  corte: string;
  section: string;
  modality?: string | null;
  career: string;
  titulationType: string;
  status: string;
  incidentCount: number;
  observationCount: number;
  incidents: IncidentDto[];
  observations: ObservationDto[];
};

export default function StudentDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState<StudentDetailDto | null>(null);
  const [loading, setLoading] = useState(false);

  // ✅ NUEVO: modal email
  const [emailOpen, setEmailOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get<StudentDetailDto>(`/admin/students/${id}`);
      setData(res.data);
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? "No se pudo cargar el detalle");
      if (e?.response?.status === 401 || e?.response?.status === 403) nav("/");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  return (
    <div style={{ padding: 16, maxWidth: 1200, margin: "0 auto" }}>
      <Space style={{ marginBottom: 12 }}>
        <Button onClick={() => nav("/admin")}>← Volver</Button>

        {/* ✅ NUEVO */}
        <Button disabled={!data} onClick={() => setEmailOpen(true)}>
          Enviar correo
        </Button>
      </Space>

      <Card loading={loading} title="Detalle del Estudiante">
        {data && (
          <>
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="DNI">{data.dni}</Descriptions.Item>
              <Descriptions.Item label="Correo">{data.email}</Descriptions.Item>
              <Descriptions.Item label="Nombres">{data.firstName}</Descriptions.Item>
              <Descriptions.Item label="Apellidos">{data.lastName}</Descriptions.Item>
              <Descriptions.Item label="Carrera">{data.career}</Descriptions.Item>
              <Descriptions.Item label="Corte">{data.corte}</Descriptions.Item>
              <Descriptions.Item label="Sección">{data.section}</Descriptions.Item>
              <Descriptions.Item label="Modalidad">{data.modality ?? "-"}</Descriptions.Item>
              <Descriptions.Item label="Tipo titulación">{data.titulationType}</Descriptions.Item>
              <Descriptions.Item label="Estado">{data.status}</Descriptions.Item>
              <Descriptions.Item label="Incidencias">{data.incidentCount}</Descriptions.Item>
              <Descriptions.Item label="Observaciones">{data.observationCount}</Descriptions.Item>
            </Descriptions>

            <Tabs
              style={{ marginTop: 16 }}
              items={[
                {
                  key: "inc",
                  label: `Incidencias (${data.incidentCount})`,
                  children: (
                    <Table
                      rowKey="id"
                      dataSource={data.incidents}
                      pagination={{ pageSize: 6 }}
                      columns={[
                        { title: "Etapa", dataIndex: "stage" },
                        { title: "Fecha", dataIndex: "date" },
                        { title: "Motivo", dataIndex: "reason" },
                        { title: "Acción", dataIndex: "action" },
                        { title: "Creado", dataIndex: "createdAt" },
                      ]}
                    />
                  ),
                },
                {
                  key: "obs",
                  label: `Observaciones (${data.observationCount})`,
                  children: (
                    <Table
                      rowKey="id"
                      dataSource={data.observations}
                      pagination={{ pageSize: 6 }}
                      columns={[
                        { title: "Autor", dataIndex: "author" },
                        { title: "Observación", dataIndex: "text" },
                        { title: "Fecha", dataIndex: "createdAt" },
                      ]}
                    />
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
          </>
        )}
      </Card>
    </div>
  );
}
