import React, { useEffect, useState } from 'react';
import { Box } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AddButton from '../../../../components/Common/AddButton';
import FormInput from '../../../../components/Forms/FormInput';
import type { Cash, CashOpening } from '../../../../types/cash';
import type { User } from '../../../../auth/types/user';
import * as cashService from '../../../../services/cashService';
import { getCurrentUser } from '../../../../auth/services/userService';
import { useOutletContext } from 'react-router-dom';

interface SalePointContext {
  currentUser: User | null;
  refreshOpenCash: () => Promise<void>;
}
const OpenCashForm: React.FC = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [openingAmount, setOpeningAmount] = useState<number>(0);
  const [cashes, setCashes] = useState<Cash[]>([]);
  const [selectedCash, setSelectedCash] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  useEffect(() => {
    const load = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);

        const all = await cashService.getCashes();
        let filtered = all;

        if (user) {
          const isCajero = user.roles?.some((r: any) => r.rolNom === 'CAJERO');
          if (isCajero) {
            filtered = all.filter(c => c.usuCod === user.usuCod);
          } else if (user.sucurCod) { //sE SUPONE QUE ES SUPERVISOR O GERENTE
            filtered = all.filter(c => c.sucurCod === user.sucurCod);
          }
        }
        setCashes(filtered);
        if (filtered.length > 0) setSelectedCash(filtered[0].cajCod);
      } catch (err) {
        console.error('Error cargando datos de caja', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);
  const { refreshOpenCash } = useOutletContext<SalePointContext>();
  const handleOpen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCash) return;

    try {
      setLoading(true);
      const payload: Partial<CashOpening> = {
        cajCod: selectedCash,
        cajaAperMontInicial: openingAmount,
        cajaAperObservacio: null
      };
      await cashService.createCashOpening(payload as any);
      await refreshOpenCash();
      navigate('/sale-point/');
      console.log('Caja abierta con éxito');
    } catch (error) {
      console.error('Error al abrir caja', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleOpen} className="bg-white rounded-lg shadow-sm p-6 mt-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Abrir Caja Registradora</h2>

      <div className="mb-4">
        <label htmlFor="caja" className="block text-sm font-medium text-gray-700 mb-2">
          Seleccionar caja <span className="text-red-500">*</span>
        </label>
        <select
          id="caja"
          value={selectedCash ?? ''}
          onChange={(e) => setSelectedCash(Number(e.target.value))}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          required
        >
          {cashes.map(c => (
            <option key={c.cajCod} value={c.cajCod}>
              {c.cajNom} (#{c.cajCod})
            </option>
          ))}
          {cashes.length === 0 && <option value="">No hay caja disponible</option>}
        </select>
      </div>

      <FormInput
        name="openingAmount"
        type="number"
        label="Monto inicial"
        value={String(openingAmount)}
        onChange={(e) => setOpeningAmount(Number(e.target.value))}
        required
        placeholder="Ej. 100.00"
      />

      <div className="flex justify-end gap-4 mt-6">
        <AddButton type="submit">
          <Box size={16} />
          Abrir caja
        </AddButton>

        <button type="button" onClick={() => navigate(-1)}>
          Cancelar
        </button>
      </div>
    </form>
  );
};

export default OpenCashForm;
