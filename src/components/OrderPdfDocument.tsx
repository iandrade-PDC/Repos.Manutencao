
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { formatOrderId } from '../lib/utils';

// Using standard fonts to ensure special characters (ã, ç, é) render correctly without external dependencies
// Helvetica is built-in to PDF readers and supports Western European languages perfectly.

const colors = {
  marinho: '#0A2342',
  mata: '#2E5C55',
  areia: '#F4F1EA',
  white: '#FFFFFF',
  gray100: '#F1F5F9',
  gray200: '#E2E8F0',
  gray500: '#64748B',
  gray800: '#1E293B',
  success: '#16A34A',
  warning: '#D97706',
  error: '#EF4444',
};

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF',
    padding: 0, // We will control padding in containers
  },
  
  // Header
  header: {
    backgroundColor: '#1E293B', // Slate 800 - Softer than Marinho
    padding: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'column',
  },
  brandName: {
    fontSize: 18,
    fontWeight: 'bold', // Helvetica supports standard weights
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 4,
  },
  brandSubtitle: {
    fontSize: 9,
    color: '#94A3B8', // Light slate
    textTransform: 'uppercase',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  osTag: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginBottom: 5,
  },
  osLabel: {
    fontSize: 8,
    color: '#94A3B8',
    marginBottom: 2,
    textAlign: 'right',
  },
  osValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  
  // Content Container
  container: {
    padding: 30,
  },
  
  // Sections
  section: {
    marginBottom: 25,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 10,
    gap: 15,
  },
  col1: { flex: 1 },
  col2: { flex: 2 },
  col3: { flex: 3 },
  
  label: {
    fontSize: 8,
    color: colors.gray500,
    marginBottom: 3,
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  value: {
    fontSize: 11,
    color: colors.gray800,
    lineHeight: 1.4,
    textAlign: 'justify',
  },
  valueLarge: {
    fontSize: 14,
    color: colors.marinho,
    fontWeight: 'bold',
  },
  
  // Divider
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    marginBottom: 15,
    marginTop: 5,
  },
  
  // Status Badge
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: colors.areia,
    padding: 10,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: colors.marinho,
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.marinho,
    width: 80,
  },
  statusValue: {
    fontSize: 10,
    color: colors.marinho,
  },

  // Box for Description
  box: {
    backgroundColor: colors.gray100,
    padding: 15,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  
  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 8,
    color: colors.gray500,
  }
});

type OrderPdfProps = {
  order: any;
}

export const OrderPdfDocument = ({ order }: OrderPdfProps) => {
  const displayId = order.short_id ? formatOrderId(order.short_id) : formatOrderId(order.id);
  const createdDate = new Date(order.created_at || order.date);
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR') + ' às ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const getPriorityLabel = (p: string) => {
     switch(p) {
        case 'urgente': return 'URGENTE';
        case 'alta': return 'ALTA';
        case 'media': return 'MÉDIA';
        case 'baixa': return 'BAIXA';
        default: return p.toUpperCase();
     }
  };

  const getStatusLabel = (s: string) => {
    switch(s) {
       case 'aberto': return 'ABERTO';
       case 'em_andamento': return 'EM ANDAMENTO';
       case 'concluido': return 'CONCLUÍDO';
       default: return s.replace('_', ' ').toUpperCase();
    }
  };

  return (
    <Document 
      title={`Ordem de Serviço ${displayId}`}
      author="Ancoradouro da Ponta"
      subject={`Relatório de Manutenção - ${displayId}`}
    >
      <Page size="A4" style={styles.page}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.brandName}>ANCORADOURO DA PONTA</Text>
            <Text style={styles.brandSubtitle}>Sistema de Gestão de Manutenção</Text>
          </View>
          <View style={styles.headerRight}>
             <View style={styles.osTag}>
                <Text style={styles.osValue}>{displayId}</Text>
             </View>
             <Text style={styles.osLabel}>ORDEM DE SERVIÇO</Text>
          </View>
        </View>

        <View style={styles.container}>
            
            {/* Status Bar */}
            <View style={styles.statusRow}>
               <View style={{ flexDirection: 'row', flex: 1, gap: 20 }}>
                   <View>
                       <Text style={styles.label}>STATUS ATUAL</Text>
                       <Text style={{...styles.value, fontWeight: 'bold', color: colors.marinho }}>
                           {getStatusLabel(order.status)}
                       </Text>
                   </View>
                   <View>
                       <Text style={styles.label}>PRIORIDADE</Text>
                       <Text style={{...styles.value, fontWeight: 'bold' }}>
                           {getPriorityLabel(order.priority)}
                       </Text>
                   </View>
                   <View>
                       <Text style={styles.label}>DATA DE ABERTURA</Text>
                       <Text style={styles.value}>{formatDate(createdDate)}</Text>
                   </View>
               </View>
            </View>

            {/* Main Info */}
            <View style={styles.section}>
                <Text style={styles.label}>TÍTULO DA SOLICITAÇÃO</Text>
                <Text style={styles.valueLarge}>{order.title}</Text>
                <View style={styles.divider} />
                
                <View style={styles.row}>
                    <View style={styles.col1}>
                        <Text style={styles.label}>SOLICITANTE</Text>
                        <Text style={styles.value}>{order.requester}</Text>
                    </View>
                    <View style={styles.col1}>
                       <Text style={styles.label}>LOCALIZAÇÃO</Text>
                       <Text style={styles.value}>{order.location}</Text>
                    </View>
                    <View style={styles.col1}>
                       <Text style={styles.label}>DEPARTAMENTO</Text>
                       <Text style={styles.value}>{order.sector || 'N/A'}</Text>
                    </View>
                </View>
            </View>
            
            {/* Description */}
            <View style={styles.section}>
                <Text style={styles.label}>DESCRIÇÃO DETALHADA</Text>
                <View style={styles.box}>
                    <Text style={styles.value}>
                        {order.description || "Sem descrição fornecida."}
                    </Text>
                </View>
            </View>

            {/* Additional Info / Footer Notes */}
            <View style={{ marginTop: 20 }}>
                <Text style={{ fontSize: 8, color: colors.gray500, fontStyle: 'italic' }}>
                   * Este documento serve como registro oficial da demanda de manutenção.
                </Text>
            </View>

        </View>

        <View style={styles.footer}>
           <Text style={styles.footerText}>Gerado em {new Date().toLocaleDateString('pt-BR')}</Text>
           <Text style={styles.footerText}>Página 1 de 1</Text>
        </View>

      </Page>
    </Document>
  );
};
