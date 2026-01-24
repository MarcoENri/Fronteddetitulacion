import { Modal, Form, Input, DatePicker, message } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { updateIncident } from "../services/incidentManageService";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  periodId: number;
  studentId: number;
  incident: {
    id: number;
    stage: string;
    date: string; // "YYYY-MM-DD"
    reason: string;
    action: string;
  } | null;
};

type FormValues = {
  stage: string;
  date: Dayjs;
  reason: string;
  action: string;
};

export default function EditIncidentModal({
  open,
  onClose,
  onSaved,
  periodId,
  studentId,
  incident,
}: Props) {
  const [form] = Form.useForm<FormValues>();

  return (
    <Modal
      title="Editar incidencia"
      open={open}
      onCancel={() => {
        onClose();
        form.resetFields();
      }}
      onOk={() => form.submit()}
      destroyOnClose
      okText="Guardar"
      cancelText="Cancelar"
      afterOpenChange={(v) => {
        if (v && incident) {
          form.setFieldsValue({
            stage: incident.stage,
            date: dayjs(incident.date),
            reason: incident.reason,
            action: incident.action,
          });
        }
      }}
    >
      <Form
        layout="vertical"
        form={form}
        onFinish={async (v) => {
          if (!incident) return;
          try {
            await updateIncident(studentId, incident.id, periodId, {
              stage: v.stage.trim(),
              date: v.date.format("YYYY-MM-DD"),
              reason: v.reason.trim(),
              action: v.action.trim(),
            });
            message.success("Incidencia actualizada ✅");
            onSaved();
            onClose();
            form.resetFields();
          } catch (e: any) {
            message.error(e?.response?.data?.message ?? "No se pudo actualizar");
          }
        }}
      >
        <Form.Item name="stage" label="Etapa" rules={[{ required: true }]}>
          <Input />
        </Form.Item>

        <Form.Item name="date" label="Fecha" rules={[{ required: true }]}>
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item name="reason" label="Motivo" rules={[{ required: true }]}>
          <Input.TextArea rows={3} />
        </Form.Item>

        <Form.Item name="action" label="Acción" rules={[{ required: true }]}>
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
