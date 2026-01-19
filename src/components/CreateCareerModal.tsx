import { Modal, Form, Input, Upload, Button, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useState } from "react";
import { createCareer } from "../services/careerService";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function CreateCareerModal({ open, onClose, onSuccess }: Props) {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Usamos FormData para empaquetar la imagen de tu galería
      const formData = new FormData();
      formData.append("name", values.name);
      
      if (fileList.length > 0) {
        // Tomamos el archivo binario real
        formData.append("image", fileList[0].originFileObj);
      }

      await createCareer(formData);
      
      message.success("Carrera creada y foto subida con éxito, mi llave ✅");
      form.resetFields();
      setFileList([]);
      onSuccess();
      onClose();
    } catch (error) {
      message.error("No se pudo subir la imagen al servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      title="Crear Nueva Carrera" 
      open={open} 
      onOk={handleOk} 
      onCancel={() => {
        onClose();
        form.resetFields();
        setFileList([]);
      }} 
      confirmLoading={loading}
      okText="Crear ahora"
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item 
          name="name" 
          label="Nombre de la Carrera" 
          rules={[{ required: true, message: 'Ponle un nombre' }]}
        >
          <Input placeholder="Ej: Redes y Telecomunicaciones" />
        </Form.Item>

        <Form.Item label="Foto (Selecciona de tu galería)">
          <Upload 
            beforeUpload={() => false} // Detiene la subida automática
            maxCount={1} 
            listType="picture"
            fileList={fileList} 
            onChange={({ fileList }) => setFileList(fileList)}
          >
            <Button icon={<UploadOutlined />}>Elegir archivo</Button>
          </Upload>
        </Form.Item>
      </Form>
    </Modal>
  );
}