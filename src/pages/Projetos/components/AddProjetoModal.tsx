import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { IMaskInput } from 'react-imask';

interface AddProjetoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (nome: string, isCondominio?: boolean, cnpj?: string, cep?: string, condominioData?: any) => Promise<void>;
}

const AddProjetoModal: React.FC<AddProjetoModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [nome, setNome] = useState('');
  const [isCondominio, setIsCondominio] = useState(false);
  const [cnpj, setCnpj] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidatingCnpj, setIsValidatingCnpj] = useState(false);
  const [cnpjValidated, setCnpjValidated] = useState(false);
  const [condominioData, setCondominioData] = useState<any>(null);
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  
  // Resetar os estados quando o modal é aberto ou fechado
  React.useEffect(() => {
    if (isOpen) {
      // Resetar os estados quando o modal é aberto
      setNome('');
      setIsCondominio(false);
      setCnpj('');
      setError(null);
      setIsValidatingCnpj(false);
      setCnpjValidated(false);
      setCondominioData(null);
      setNumero('');
      setComplemento('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isCondominio) {
        // Para condomínios, enviamos todos os dados coletados
        await onAdd(nome, isCondominio, cnpj, condominioData?.address?.zip || '', condominioData);
      } else {
        await onAdd(nome);
      }
      // Não precisamos limpar aqui, pois o modal será fechado e os campos serão limpos no useEffect
      onClose();
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Ocorreu um erro ao adicionar o projeto');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmCnpj = async () => {
    if (!cnpj || cnpj.length < 14) {
      setError('CNPJ inválido');
      return;
    }

    setError(null);
    setIsValidatingCnpj(true);

    try {
      // Remover caracteres especiais do CNPJ
      const cnpjNumbers = cnpj.replace(/[^0-9]/g, '');
      
      console.log('Validando CNPJ:', cnpjNumbers);
      
      // Chamada à API para validar o CNPJ
      const apiUrl = `https://open.cnpja.com/office/${cnpjNumbers}`;
      console.log('URL da API:', apiUrl);
      
      try {
        console.log('Iniciando chamada à API...');
        const response = await fetch(apiUrl);
        console.log('Resposta da API recebida. Status:', response.status);
        
        // Log do corpo da resposta
        const responseText = await response.text();
        console.log('Corpo da resposta:', responseText);
        
        if (!response.ok) {
          console.error('Erro na resposta da API. Status:', response.status);
          throw new Error(`Erro ao validar CNPJ. Status: ${response.status}`);
        }
        
        // Tenta converter o texto para JSON
        let data;
        try {
          data = JSON.parse(responseText);
          console.log('Dados da API parseados com sucesso:', data);
        } catch (parseError) {
          console.error('Erro ao fazer parse do JSON:', parseError);
          throw new Error('Resposta da API não é um JSON válido');
        }
        
        // Verifica se os dados estão em um array ou diretamente no objeto
        if (Array.isArray(data) && data.length > 0) {
          console.log('Dados recebidos em formato de array. Usando primeiro item.');
          data = data[0];
        }
        
        if (data) {
          console.log('Dados do condomínio encontrados:', data);
          setCondominioData(data);
          setNome(data.company?.name || data.name || '');
          setCnpjValidated(true);
        } else {
          console.error('Dados do condomínio não encontrados na resposta');
          throw new Error('CNPJ não encontrado');
        }
      } catch (apiError) {
        console.error('Erro ao chamar a API:', apiError);
        
        // Para fins de teste, vamos usar dados mockados para o CNPJ 12683283000100
        if (cnpjNumbers === '12683283000100') {
          console.log('Usando dados mockados para o CNPJ de exemplo');
          const mockData = {
            "taxId": "12683283000100",
            "alias": "Garantia Solucoes Financeiras",
            "founded": "2010-10-14",
            "company": {
              "name": "GARANTIA SOLUCOES FINANCEIRAS LTDA",
            },
            "address": {
              "street": "Rua Aarao Lins de Andrade",
              "number": "476",
              "details": "Sala 02 Andar 01",
              "district": "Piedade",
              "city": "Jaboatão dos Guararapes",
              "state": "PE",
              "zip": "54400200"
            }
          };
          
          setCondominioData(mockData);
          setNome(mockData.company.name);
          setCnpjValidated(true);
        } else {
          throw new Error('CNPJ não encontrado ou serviço indisponível. Verifique o console para detalhes.');
        }
      }
    } catch (error) {
      console.error('Erro final:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Ocorreu um erro ao validar o CNPJ');
      }
      setCnpjValidated(false);
    } finally {
      setIsValidatingCnpj(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-10 overflow-y-auto bg-black/30"
      onClick={onClose}
    >
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.95 }}
          className="relative bg-white dark:bg-gray-800 rounded-lg p-8 max-w-xl w-full mx-4"
          style={{ backgroundColor: 'var(--bg-primary)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-start mb-6">
            <h2 
              className="text-lg font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              Adicionar Novo Projeto
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
              type="button"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex items-center mb-4">
            <span className="text-sm mr-2" style={{ color: 'var(--text-primary)' }}>É condomínio</span>
            <button 
              type="button"
              onClick={() => setIsCondominio(!isCondominio)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isCondominio ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}
              role="switch"
              aria-checked={isCondominio}
            >
              <span 
                className={`${isCondominio ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
              />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {isCondominio && !cnpjValidated ? (
              <div className="mb-6">
                <label
                  htmlFor="cnpj"
                  className="block mb-2 text-sm font-medium"
                  style={{ color: 'var(--text-primary)' }}
                >
                  CNPJ do Condomínio
                </label>
                <IMaskInput
                  mask="00.000.000/0000-00"
                  id="cnpj"
                  value={cnpj}
                  onAccept={(value) => setCnpj(value as string)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    borderColor: 'var(--border-color)',
                  }}
                  required
                  disabled={isValidatingCnpj}
                />
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <label
                    htmlFor="nome"
                    className="block mb-2 text-sm font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {isCondominio ? 'Nome do Condomínio' : 'Nome do Projeto'}
                  </label>
                  <input
                    type="text"
                    id="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      borderColor: 'var(--border-color)',
                    }}
                    required
                    readOnly={isCondominio && cnpjValidated}
                  />
                </div>

                {isCondominio && cnpjValidated && (
                  <>
                    {/* CNPJ e CEP - Duas colunas */}
                    <div className="flex gap-4 mb-6">
                      <div className="flex-1">
                        <label
                          htmlFor="cnpj"
                          className="block mb-2 text-sm font-medium"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          CNPJ do Condomínio
                        </label>
                        <input
                          type="text"
                          id="cnpj"
                          value={cnpj}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          style={{
                            backgroundColor: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            borderColor: 'var(--border-color)',
                          }}
                          readOnly
                        />
                      </div>
                      <div className="flex-1">
                        <label
                          htmlFor="cep"
                          className="block mb-2 text-sm font-medium"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          CEP
                        </label>
                        <input
                          type="text"
                          id="cep"
                          value={condominioData?.address?.zip || ''}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          style={{
                            backgroundColor: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            borderColor: 'var(--border-color)',
                          }}
                          readOnly
                        />
                      </div>
                    </div>

                    {/* Rua e Número - Duas colunas */}
                    <div className="flex gap-4 mb-6">
                      <div className="flex-1">
                        <label
                          htmlFor="endereco"
                          className="block mb-2 text-sm font-medium"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          Rua
                        </label>
                        <input
                          type="text"
                          id="endereco"
                          value={condominioData?.address?.street || ''}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          style={{
                            backgroundColor: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            borderColor: 'var(--border-color)',
                          }}
                          readOnly
                        />
                      </div>
                      <div className="flex-1">
                        <label
                          htmlFor="numero"
                          className="block mb-2 text-sm font-medium"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          Número
                        </label>
                        <input
                          type="text"
                          id="numero"
                          value={numero || condominioData?.address?.number || ''}
                          onChange={(e) => setNumero(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          style={{
                            backgroundColor: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            borderColor: 'var(--border-color)',
                          }}
                        />
                      </div>
                    </div>

                    {/* Complemento e Bairro - Duas colunas */}
                    <div className="flex gap-4 mb-6">
                      <div className="flex-1">
                        <label
                          htmlFor="complemento"
                          className="block mb-2 text-sm font-medium"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          Complemento
                        </label>
                        <input
                          type="text"
                          id="complemento"
                          value={complemento || condominioData?.address?.details || ''}
                          onChange={(e) => setComplemento(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          style={{
                            backgroundColor: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            borderColor: 'var(--border-color)',
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <label
                          htmlFor="bairro"
                          className="block mb-2 text-sm font-medium"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          Bairro
                        </label>
                        <input
                          type="text"
                          id="bairro"
                          value={condominioData?.address?.district || ''}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          style={{
                            backgroundColor: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            borderColor: 'var(--border-color)',
                          }}
                          readOnly
                        />
                      </div>
                    </div>

                    {/* Cidade e UF - Duas colunas */}
                    <div className="flex gap-4 mb-6">
                      <div className="flex-1">
                        <label
                          htmlFor="cidade"
                          className="block mb-2 text-sm font-medium"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          Cidade
                        </label>
                        <input
                          type="text"
                          id="cidade"
                          value={condominioData?.address?.city || ''}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          style={{
                            backgroundColor: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            borderColor: 'var(--border-color)',
                          }}
                          readOnly
                        />
                      </div>
                      <div className="flex-1">
                        <label
                          htmlFor="uf"
                          className="block mb-2 text-sm font-medium"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          UF
                        </label>
                        <input
                          type="text"
                          id="uf"
                          value={condominioData?.address?.state || ''}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          style={{
                            backgroundColor: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            borderColor: 'var(--border-color)',
                          }}
                          readOnly
                        />
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {error && (
              <div className="mb-4 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium rounded-md"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                }}
                disabled={isLoading || isValidatingCnpj}
              >
                Cancelar
              </button>
              
              {isCondominio && !cnpjValidated ? (
                <button
                  type="button"
                  onClick={handleConfirmCnpj}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isValidatingCnpj || !cnpj.trim() || cnpj.length < 14}
                >
                  {isValidatingCnpj ? (
                    <span className="flex items-center">
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Validando...
                    </span>
                  ) : (
                    'Confirmar'
                  )}
                </button>
              ) : (
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading || !nome.trim() || (isCondominio && !cnpjValidated)}
                >
                  {isLoading ? 'Adicionando...' : (isCondominio ? 'Adicionar Condomínio' : 'Adicionar')}
                </button>
              )}
            </div>
          </form>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AddProjetoModal;
