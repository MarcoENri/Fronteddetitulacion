import { Modal, Form, Select, Input, Switch, message } from "antd";
import { useEffect, useState } from "react";
import type { UserOption } from "../services/adminLookupService";
import { listUsersByRole } from "../services/adminLookupService";
import { assignCareer } from "../services/adminAssignService";
import { assignCareersToUser } from "../services/adminCareersToUserService";

// Definimos el tipo para que coincida con el del padre
type CareerItem = {
  key: string;
  label: string;
  isFixed?: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  // ✅ Recibimos las carreras actuales de las tarjetas
  availableCareers: CareerItem[]; 
};

type FormValues = {
  careerId: string; // Usamos string porque es la 'key' (ej: "Desarrollo de software")
  coordinatorId: number;
  tutorId?: number;
  projectName?: string;
  onlyUnassigned: boolean;
};

export default function AssignCareerModal({ open, onClose, onSuccess, availableCareers }: Props) {
  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(false);

  const [coordinators, setCoordinators] = useState<UserOption[]>([]);
  const [tutors, setTutors] = useState<UserOption[]>([]);

  useEffect(() => {
    if (!open) return;

    (async () => {
      try {
        // ✅ Mantenemos tu lógica de cargar Coordinadores y Tutores del servidor
        const [coords, tuts] = await Promise.all([
          listUsersByRole("COORDINATOR"),
          listUsersByRole("TUTOR"),
        ]);
        setCoordinators(coords);
        setTutors(tuts);
        
        form.setFieldsValue({ onlyUnassigned: true });
      } catch (e: any) {
        message.error(e?.response?.data?.message ?? "No se pudo cargar datos");
      }
    })();
  }, [open, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // ✅ Paso 1: asegurar user_career para evitar error de backend
      // Se envía el nombre/key de la carrera como identificador
      await assignCareersToUser(values.coordinatorId, [values.careerId as any]);

      // ✅ Paso 2: asignación masiva real
      await assignCareer(values.careerId as any, {
        coordinatorId: values.coordinatorId,
        tutorId: values.tutorId ?? null,
        projectName: values.projectName?.trim() ? values.projectName.trim() : null,
        onlyUnassigned: values.onlyUnassigned,
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
      cancelText="Cancel"
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
            // ✅ Ahora las opciones vienen de las tarjetas (fijas + nuevas)
            options={availableCareers.map((c) => ({ 
              value: c.key, 
              label: c.label 
            }))}
            placeholder="Selecciona carrera"
          />
        </Form.Item>

        <Form.Item
          label="Coordinador"
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

        <Form.Item label="Tutor (opcional)" name="tutorId">
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            options={tutors.map((u) => ({
              value: u.id,
              label: `${u.fullName} (@${u.username})`,
            }))}
            placeholder="Selecciona tutor (opcional)"
          />
        </Form.Item>

        <Form.Item label="Proyecto (opcional)" name="projectName">
          <Input placeholder="Si lo llenas, se asigna a todos los estudiantes del filtro" />
        </Form.Item>

        <Form.Item
          label="Solo estudiantes no asignados"
          name="onlyUnassigned"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
}