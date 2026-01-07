import { Modal, Form, InputNumber, Input, message } from "antd";
import { useState } from "react";
import { assignProject } from "../services/coordinatorStudentService";


type Props = {
  open: boolean;
  studentIds: number[];
  onClose: () => void;
  onSuccess: () => void;
};

type FormValues = {
  tutorId: number;
  projectName: string;
};

export default function AssignTutorBulkModal({ open, studentIds, onClose, onSuccess }: Props) {
  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(false);

  const handleOk = async () => {
    try {
      const v = await form.validateFields();
      setLoading(true);

      await Promise.all(
        studentIds.map((id) =>
          assignProject(id, { tutorId: v.tutorId, projectName: v.projectName.trim() })
        )
      );

      message.success(`Asignado a ${studentIds.length} estudiante(s) ✅`);
      onSuccess();
      onClose();
      form.resetFields();
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error(e?.response?.data?.message ?? "Error asignando tutor/proyecto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Asignar Tutor + Proyecto (seleccionados)"
      open={open}
      onOk={handleOk}
      okButtonProps={{ loading, disabled: studentIds.length === 0 }}
      onCancel={() => {
        onClose();
        form.resetFields();
      }}
      destroyOnClose
    >
      <div style={{ marginBottom: 10, color: "#666" }}>
        Seleccionados: <b>{studentIds.length}</b>
      </div>

      <Form layout="vertical" form={form}>
        <Form.Item
          label="Tutor ID"
          name="tutorId"
          rules={[{ required: true, message: "Ingresa el ID del tutor" }]}
        >
          <InputNumber style={{ width: "100%" }} min={1} />
        </Form.Item>

        <Form.Item
          label="Proyecto"
          name="projectName"
          rules={[{ required: true, message: "Ingresa el nombre del proyecto" }]}
        >
          <Input placeholder="Ej: Sistema Web para Gestión de Titulación" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
