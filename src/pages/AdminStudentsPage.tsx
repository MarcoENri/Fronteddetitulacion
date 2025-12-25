import { Button, Card, Table, Upload, message, Space, Tag } from "antd";
import type { UploadProps } from "antd";
import { useEffect, useState } from "react";
import { importStudentsXlsx, listStudents } from "../services/adminStudentService";
import type { AdminStudentRow } from "../services/adminStudentService";

import { logout } from "../services/authService";
import { useNavigate } from "react-router-dom";

export default function AdminStudentsPage() {
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [rows, setRows] = useState<AdminStudentRow[]>([]);
  const nav = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      setRows(await listStudents());
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? "No se pudo cargar estudiantes");
      if (e?.response?.status === 401 || e?.response?.status === 403) {
        logout();
        nav("/");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const uploadProps: UploadProps = {
    accept: ".xlsx",
    maxCount: 1,
    beforeUpload: async (file) => {
      setImporting(true);
      try {
        const res = await importStudentsXlsx(file as File);
        message.success(
          `Importación: total=${res.totalRows} insert=${res.insertedRows} upd=${res.updatedRows} fail=${res.failedRows}`
        );
        await load();
      } catch (e: any) {
        message.error(e?.response?.data?.message ?? "Error al importar Excel");
      } finally {
        setImporting(false);
      }
      return false;
    },
  };

  return (
    <div style={{ padding: 16, maxWidth: 1200, margin: "0 auto" }}>
      <Space style={{ width: "100%", justifyContent: "space-between", marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Admin · Estudiantes</h2>
        <Button
          danger
          onClick={() => {
            logout();
            nav("/");
          }}
        >
          Cerrar sesión
        </Button>
      </Space>

      <Card title="Carga masiva desde Excel (.xlsx)" style={{ marginBottom: 16 }}>
        <Space>
          <Upload {...uploadProps}>
            <Button type="primary" loading={importing}>
              Seleccionar Excel y subir
            </Button>
          </Upload>
          <Button onClick={load} loading={loading}>
            Refrescar
          </Button>
        </Space>
        <div style={{ marginTop: 8, color: "#666" }}>
          Columnas: dni, first_name, last_name, email, corte, section, modality, career_name, titulation_type
        </div>
      </Card>

      <Card title="Listado de estudiantes">
        <Table<AdminStudentRow>
          rowKey="id"
          loading={loading}
          dataSource={rows}
          pagination={{ pageSize: 10 }}
          columns={[
            { title: "DNI", dataIndex: "dni" },
            { title: "Nombres", dataIndex: "firstName" },
            { title: "Apellidos", dataIndex: "lastName" },
            { title: "Email", dataIndex: "email" },
            { title: "Corte", dataIndex: "corte" },
            { title: "Sección", dataIndex: "section" },
            { title: "Modalidad", dataIndex: "modality" },
            { title: "Carrera", dataIndex: "career" },
            { title: "Tipo", dataIndex: "titulationType", render: (v) => <Tag>{v}</Tag> },
            { title: "Estado", dataIndex: "status" },
            { title: "Incidencias", dataIndex: "incidentCount" },
            { title: "Observaciones", dataIndex: "observationCount" },

            // ✅ NUEVA COLUMNA: Detalle
            {
              title: "Acción",
              render: (_, row) => (
                <Button type="link" onClick={() => nav(`/admin/students/${row.id}`)}>
                  Ver detalle
                </Button>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
