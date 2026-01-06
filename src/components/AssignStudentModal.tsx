import { Modal, Form, Select, Input, message } from "antd";
import { useEffect, useState } from "react";
import type { UserOption } from "../services/adminLookupService";
import { listUsersByRole } from "../services/adminLookupService";
import { assignStudent } from "../services/adminAssignService";

type Props = {
  open: boolean;
  studentId: number | null;
  onClose: () => void;
  onSuccess: () => void;
};

type FormValues = {
  coordinatorId: number;
  tutorId?: number;
  projectName?: string;
};

export default function AssignStudentModal({ open, studentId, onClose, onSuccess }: Props) {
  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(false);

  const [coordinators, setCoordinators] = useState<UserOption[]>([]);
  const [tutors, setTutors] = useState<UserOption[]>([]);

  useEffect(() => {
    if (!open) return;

    (async () => {
      try {
        const [coords, tuts] = await Promise.all([
          listUsersByRole("ROLE_COORDINATOR"),
          listUsersByRole("ROLE_TUTOR"),
        ]);
        setCoordinators(coords);
        setTutors(tuts);
      } catch (e: any) {
        message.error(e?.response?.data?.message ?? "No se pudo cargar coordinadores/tutores");
      }
    })();
  }, [open]);

  const handleOk = async () => {
    if (!studentId) return;
    try {
      const values = await form.validateFields();
      setLoading(true);

      await assignStudent(studentId, {
        coordinatorId: values.coordinatorId,
        tutorId: values.tutorId ?? null,
        projectName: values.projectName?.trim() ? values.projectName.trim() : null,
      });

      message.success("Asignación guardada ✅");
      onSuccess();
      onClose();
      form.resetFields();
    } catch (e: any) {
      if (e?.errorFields) return; // validación de antd
      message.error(e?.response?.data?.message ?? "Error al asignar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Asignar Coordinador / Tutor / Proyecto"
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
          <Input placeholder="Ej: Sistema Web para Gestión de Titulación" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
