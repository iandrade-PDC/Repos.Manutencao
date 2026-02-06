
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import { formatOrderId } from '../lib/utils';

// Register standard fonts
Font.register({
  family: 'Open Sans',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-regular.ttf' },
    { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-600.ttf', fontWeight: 600 },
    { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-700.ttf', fontWeight: 700 }
  ]
});

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Open Sans',
  },
  // Header with full accent background
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
    backgroundColor: '#0F172A', // Slate 900
    padding: 20,
    borderRadius: 6,
  },
  titleContainer: {
    flexDirection: 'column',
  },
  companyName: {
    fontSize: 16,
    fontWeight: 700,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  reportName: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  orderTag: {
    backgroundColor: '#334155',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    alignItems: 'flex-end',
  },
  orderLabel: {
    fontSize: 8,
    color: '#94A3B8',
    marginBottom: 2,
  },
  orderValue: {
    fontSize: 14,
    fontWeight: 700,
    color: '#FFFFFF',
  },
  
  // Content
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: '#334155',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 6,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  // Grid System
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  col2: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  colFull: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  
  // Field Styles
  fieldLabel: {
    fontSize: 8,
    color: '#64748B',
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: 600,
  },
  fieldValue: {
    fontSize: 10,
    color: '#0F172A',
    fontWeight: 400,
    lineHeight: 1.4,
  },
  
  // Status Badge
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 8,
    color: '#FFFFFF',
    marginTop: 4,
    alignSelf: 'flex-end',
    fontWeight: 700,
  },
  
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#94A3B8',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 10,
  }
});

type OrderPdfProps = {
  order: any;
}

export const OrderPdfDocument = ({ order }: OrderPdfProps) => {
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'concluido': return '#16A34A'; // Green
      case 'em_andamento': return '#2563EB'; // Blue
      default: return '#D97706'; // Orange
    }
  };

  const getPriorityColor = (priority: string) => {
    switch(priority) {
        case 'urgente': return '#EF4444';
        case 'alta': return '#F97316';
        default: return '#0F172A';
    }
  };

  const displayId = order.short_id ? formatOrderId(order.short_id) : formatOrderId(order.id);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.companyName}>ANCORADOURO DA PONTA</Text>
            <Text style={styles.reportName}>RELATÓRIO TÉCNICO DE MANUTENÇÃO</Text>
          </View>
          
          <View style={styles.orderTag}>
            <Text style={styles.orderLabel}>Nº CHECKLIST/OS</Text>
            <Text style={styles.orderValue}>{displayId}</Text>
            <View style={{ 
                backgroundColor: getStatusColor(order.status), 
                paddingHorizontal: 6, 
                paddingVertical: 2, 
                borderRadius: 2,
                marginTop: 4 
            }}>
                <Text style={{ fontSize: 7, color: '#FFF', fontWeight: 700 }}>
                    {order.status.replace('_', ' ').toUpperCase()}
                </Text>
            </View>
          </View>
        </View>

        {/* DETAILS SECTION */}
        <View style={styles.section}>
           <Text style={styles.sectionTitle}>DETALHAMENTO DA SOLICITAÇÃO</Text>
           
           <View style={styles.grid}>
             {/* Row 1 */}
             <View style={styles.colFull}>
               <Text style={styles.fieldLabel}>TÍTULO DO CHAMADO</Text>
               <Text style={{...styles.fieldValue, fontSize: 12, fontWeight: 700}}>{order.title}</Text>
             </View>

             {/* Row 2 */}
             <View style={styles.col2}>
               <Text style={styles.fieldLabel}>SOLICITANTE</Text>
               <Text style={styles.fieldValue}>{order.requester}</Text>
             </View>
             <View style={styles.col2}>
               <Text style={styles.fieldLabel}>DATA DE ABERTURA</Text>
               <Text style={styles.fieldValue}>
                  {new Date(order.created_at || order.date).toLocaleDateString('pt-BR')} às {new Date(order.created_at || order.date).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}
               </Text>
             </View>
             
             {/* Row 3 */}
             <View style={styles.col2}>
                <Text style={styles.fieldLabel}>PRIORIDADE</Text>
                <Text style={{...styles.fieldValue, color: getPriorityColor(order.priority), fontWeight: 700 }}>
                    {order.priority.toUpperCase()}
                </Text>
             </View>
             <View style={styles.col2}>
                <Text style={styles.fieldLabel}>STATUS ATUAL</Text>
                <Text style={styles.fieldValue}>{order.status.replace('_', ' ').toUpperCase()}</Text>
             </View>
           </View>
        </View>

        {/* LOCATION SECTION */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>LOCALIZAÇÃO E AMBIENTE</Text>
            <View style={styles.grid}>
                <View style={styles.col2}>
                    <Text style={styles.fieldLabel}>LOCALIZAÇÃO</Text>
                    <Text style={styles.fieldValue}>{order.location}</Text>
                </View>
                <View style={styles.col2}>
                    <Text style={styles.fieldLabel}>SETOR / DEPARTAMENTO</Text>
                    <Text style={styles.fieldValue}>{order.sector || 'Não informado'}</Text>
                </View>
            </View>
        </View>

        {/* DESCRIPTION SECTION */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>DESCRIÇÃO DO PROBLEMA</Text>
            <View style={{...styles.colFull, minHeight: 80}}>
               <Text style={styles.fieldValue}>
                 {order.description || "Nenhuma descrição detalhada fornecida."}
               </Text>
            </View>
        </View>

        {/* RESOLUTION SECTION (If Applicable) */}
        {order.status === 'concluido' && (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>DADOS TÉCNICOS DA RESOLUÇÃO</Text>
                <View style={{...styles.colFull, backgroundColor: '#F0FDF4', borderColor: '#BBF7D0'}}>
                   <Text style={{...styles.fieldLabel, color: '#15803D'}}>DIAGNÓSTICO E SOLUÇÃO</Text>
                   <Text style={styles.fieldValue}>
                      A solicitação consta como finalizada no sistema. Verifique os relatórios fotográficos e logs de execução para validação técnica.
                   </Text>
                   {/* Here we could map over history logs if passed in the order object to show resolution notes */}
                </View>
            </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Relatório gerado digitalmente em {new Date().toLocaleDateString('pt-BR')} - Ancoradouro da Ponta - Gestão de Manutenção
        </Text>
        
      </Page>
    </Document>
  );
};
