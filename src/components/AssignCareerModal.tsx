// src/components/AssignCareerModal.tsx
import { Modal, Form, Select, Input, Switch, message } from "antd";
import { useEffect, useMemo, useState } from "react";

import type { UserOption, CareerOption } from "../services/adminLookupService";
import { listUsersByRole, listCareers } from "../services/adminLookupService";

import { assignByCareer } from "../services/adminAssignService"; // ✅ CAMBIO: antes assignCareer

import { useActivePeriod } from "../hooks/useActivePeriod";

type CareerItem = {
  key: string;
  label: string;
  isFixed?: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  availableCareers: CareerItem[]; // solo para “bonito”, NO para enviar al backend
};

type FormValues = {
  careerId: number; // ✅ ID real (Long)
  coordinatorId: number;
  tutorId?: number;
  projectName?: string;
  onlyUnassigned: boolean;
};

export default function AssignCareerModal({
  open,
  onClose,
  onSuccess,
  availableCareers,
}: Props) {
  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(false);

  const [coordinators, setCoordinators] = useState<UserOption[]>([]);
  const [tutors, setTutors] = useState<UserOption[]>([]);
  const [careers, setCareers] = useState<CareerOption[]>([]);

  const activePeriod = useActivePeriod();

  // prioridad “bonita” para que carreras de tus tarjetas aparezcan primero
  const careerPriority = useMemo(() => {
    return new Set((availableCareers ?? []).map((c) => c.key.toLowerCase().trim()));
  }, [availableCareers]);

  useEffect(() => {
    if (!open) return;

    (async () => {
      try {
        const [coords, tuts, cars] = await Promise.all([
          listUsersByRole("COORDINATOR"),
          listUsersByRole("TUTOR"),
          listCareers(),
        ]);

        setCoordinators(coords);
        setTutors(tuts);

        const sorted = [...cars].sort((a, b) => {
          const aKey = a.name.toLowerCase().trim();
          const bKey = b.name.toLowerCase().trim();
          const aP = careerPriority.has(aKey) ? 0 : 1;
          const bP = careerPriority.has(bKey) ? 0 : 1;
          if (aP !== bP) return aP - bP;
          return a.name.localeCompare(b.name);
        });

        setCareers(sorted);

        form.setFieldsValue({ onlyUnassigned: true });
      } catch (e: any) {
        message.error(e?.response?.data?.message ?? "No se pudo cargar datos");
      }
    })();
  }, [open, form, careerPriority]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // ✅ periodo activo obligatorio (para asignar por periodo)
      if (!activePeriod.periodId) {
        message.error(activePeriod.error ?? "No hay periodo activo. Activa uno primero.");
        return;
      }

      await assignByCareer({
        careerId: values.careerId, // ✅ number
        coordinatorId: values.coordinatorId,
        tutorId: values.tutorId ?? null,
        projectName: values.projectName?.trim() ? values.projectName.trim() : null,
        onlyUnassigned: values.onlyUnassigned,
        academicPeriodId: activePeriod.periodId, // ✅ clave
      });

      message.success("Asignación masiva aplicada ✅");
      onSuccess();
      onClose();
      form.resetFields();
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error(e?.response?.data?.message ?? "Error en asignación masiva");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Asignación masiva por carrera"
      open={open}
      onOk={handleOk}
      okButtonProps={{ loading }}
      onCancel={() => {
        onClose();
        form.resetFields();
      }}
      destroyOnClose
      okText="OK"
      cancelText="Cancelar"
    >
      <Form layout="vertical" form={form}>
        <Form.Item
          label="Carrera"
          name="careerId"
          rules={[{ required: true, message: "Selecciona una carrera" }]}
        >
          <Select
            showSearch
            optionFilterProp="label"
            options={careers.map((c) => ({
              value: c.id,   // ✅ ID real
              label: c.name, // 👁️ texto
            }))}
            placeholder="Selecciona carrera"
          />
        </Form.Item>

        <Form.Item
          label="Docente"
          name="coordinatorId"
          rules={[{ required: true, message: "Selecciona un coordinador" }]}
        >
          <Select
            showSearch
            optionFilterProp="label"
            options={coordinators.map((u) => ({
              value: u.id,
              label: `${u.fullName} (@${u.username})`,
            }))}
            placeholder="Selecciona coordinador"
          />
        </Form.Item>

  

        <div style={{ marginTop: 8, fontSize: 12, opacity: 0.85 }}>
          <b>Periodo activo:</b>{" "}
          {activePeriod.loading ? "Cargando..." : activePeriod.periodName ?? "NO ACTIVO"}
        </div>
      </Form>
    </Modal>
  );
}
