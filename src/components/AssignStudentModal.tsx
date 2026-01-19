import { Modal, Form, Select, Input, message, Upload, Button } from "antd";
import { useEffect, useState } from "react";
import type { UserOption } from "../services/adminLookupService";
import { listUsersByRole } from "../services/adminLookupService";
import { assignStudent } from "../services/adminAssignService";
import { UploadOutlined } from "@ant-design/icons";

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
  // Estado para capturar el archivo de la imagen
  const [fileList, setFileList] = useState<any[]>([]);

  const [coordinators, setCoordinators] = useState<UserOption[]>([]);
  const [tutors, setTutors] = useState<UserOption[]>([]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const [coords, tuts] = await Promise.all([
          listUsersByRole("COORDINATOR"),
          listUsersByRole("TUTOR"),
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

      /** * EXPLICACIÓN MI LLAVE:
       * Usamos FormData en lugar de un objeto simple { } 
       * para que el navegador pueda empaquetar el archivo binario de la imagen.
       */
      const formData = new FormData();
      formData.append("coordinatorId", String(values.coordinatorId));
      if (values.tutorId) formData.append("tutorId", String(values.tutorId));
      if (values.projectName) formData.append("projectName", values.projectName);
      
      // Si el usuario seleccionó una foto, la metemos al paquete
      if (fileList.length > 0) {
        formData.append("foto", fileList[0].originFileObj);
      }

      // Enviamos el formData completo al servicio
      await assignStudent(studentId, formData as any);

      message.success("Datos y foto guardados correctamente ✅");
      onSuccess();
      onClose();
      form.resetFields();
      setFileList([]);
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error(e?.response?.data?.message ?? "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Asignar Detalles y Foto"
      open={open}
      onOk={handleOk}
      okButtonProps={{ loading }}
      onCancel={() => {
        onClose();
        form.resetFields();
        setFileList([]);
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
          <Input placeholder="Ej: Sistema Web de Titulación" />
        </Form.Item>

        {/* ESTA ES LA PARTE CLAVE PARA SUBIR EL ARCHIVO */}
        <Form.Item label="Foto de Perfil">
          <Upload
            beforeUpload={() => false} // Detiene la subida automática para enviarla con el botón OK
            listType="picture"
            maxCount={1}
            fileList={fileList}
            onChange={({ fileList }) => setFileList(fileList)}
          >
            <Button icon={<UploadOutlined />}>Click para elegir foto</Button>
          </Upload>
        </Form.Item>
      </Form>
    </Modal>
  );
}