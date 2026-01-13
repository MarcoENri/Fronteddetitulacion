import { Modal, Form, Select, Input, Switch, message } from "antd";
import { useEffect, useState } from "react";
import type { CareerOption, UserOption } from "../services/adminLookupService";
import { listCareers, listUsersByRole } from "../services/adminLookupService";
import { assignCareer } from "../services/adminAssignService";
import { assignCareersToUser } from "../services/adminCareersToUserService";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

type FormValues = {
  careerId: number;
  coordinatorId: number;
  tutorId?: number;
  projectName?: string;
  onlyUnassigned: boolean;
};

export default function AssignCareerModal({ open, onClose, onSuccess }: Props) {
  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(false);

  const [careers, setCareers] = useState<CareerOption[]>([]);
  const [coordinators, setCoordinators] = useState<UserOption[]>([]);
  const [tutors, setTutors] = useState<UserOption[]>([]);

  useEffect(() => {
    if (!open) return;

    (async () => {
      try {
        const [cs, coords, tuts] = await Promise.all([
          listCareers(),
          listUsersByRole("COORDINATOR"),
          listUsersByRole("TUTOR"),
        ]);
        setCareers(cs);
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
      await assignCareersToUser(values.coordinatorId, [values.careerId]);

      // ✅ Paso 2: asignación masiva real
      await assignCareer(values.careerId, {
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
            options={careers.map((c) => ({ value: c.id, label: c.name }))}
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
