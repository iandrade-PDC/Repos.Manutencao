
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

// Register a standard font (optional, using default Helvetica for now to save setup time/errors)
// Font.register({ family: 'Roboto', src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf' });

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#1E40AF', // Blue-800
    paddingBottom: 10,
  },
  logo: {
    width: 50,
    height: 50,
  },
  titleContainer: {
    flexDirection: 'column',
  },
  companyName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E40AF',
    textTransform: 'uppercase',
  },
  reportName: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 4,
  },
  orderIdBox: {
    backgroundColor: '#F1F5F9',
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  orderIdLabel: {
    fontSize: 8,
    color: '#64748B',
  },
  orderIdValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 8,
    marginTop: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  label: {
    fontSize: 10,
    color: '#64748B',
    width: 100,
    fontWeight: 'bold',
  },
  value: {
    fontSize: 10,
    color: '#334155',
    flex: 1,
  },
  descriptionBox: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 4,
    marginTop: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  descriptionText: {
    fontSize: 10,
    color: '#334155',
    lineHeight: 1.4,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  metaItem: {
    width: '45%',
    marginBottom: 6,
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
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    fontSize: 8,
    color: '#FFFFFF',
    marginTop: 4,
    textAlign: 'center',
  }
});

type OrderPdfProps = {
  order: any; // Using any for flexibility with mocks, ideally strictly typed
}

export const OrderPdfDocument = ({ order }: OrderPdfProps) => {
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'concluido': return '#16A34A'; // Green
      case 'em_andamento': return '#2563EB'; // Blue
      default: return '#D97706'; // Orange
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.companyName}>MANUTENÇÃO SYS</Text>
            <Text style={styles.reportName}>Relatório de Demanda de Serviço</Text>
          </View>
          
          <View style={styles.orderIdBox}>
            <Text style={styles.orderIdLabel}>Nº DA ORDEM</Text>
            <Text style={styles.orderIdValue}>{order.id}</Text>
            <Text style={{...styles.statusBadge, backgroundColor: getStatusColor(order.status)}}>
              {order.status.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Main Info */}
        <View>
           <Text style={styles.sectionTitle}>DETALHES DA SOLICITAÇÃO</Text>
           
           <View style={styles.metaGrid}>
             <View style={styles.row}>
               <Text style={styles.label}>Título:</Text>
               <Text style={styles.value}>{order.title}</Text>
             </View>
             <View style={styles.row}>
               <Text style={styles.label}>Prioridade:</Text>
               <Text style={styles.value}>{order.priority.toUpperCase()}</Text>
             </View>
             <View style={styles.row}>
               <Text style={styles.label}>Data Abertura:</Text>
               <Text style={styles.value}>{order.date}</Text>
             </View>
             <View style={styles.row}>
               <Text style={styles.label}>Solicitante:</Text>
               <Text style={styles.value}>{order.requester}</Text>
             </View>
           </View>

           <Text style={styles.sectionTitle}>LOCALIZAÇÃO</Text>
           <View style={styles.metaGrid}>
             <View style={styles.row}>
               <Text style={styles.label}>Local:</Text>
               <Text style={styles.value}>{order.location}</Text>
             </View>
             <View style={styles.row}>
               <Text style={styles.label}>Setor/Ambiente:</Text>
               <Text style={styles.value}>{order.sector}</Text>
             </View>
           </View>

           <Text style={styles.sectionTitle}>DESCRIÇÃO O PROCESSO</Text>
           <View style={styles.descriptionBox}>
             <Text style={styles.descriptionText}>
               {order.description || "Nenhuma descrição fornecida."}
             </Text>
           </View>

           {/* Placeholder for future resolution details */}
           {order.status === 'concluido' && (
             <>
               <Text style={styles.sectionTitle}>DADOS DE RESOLUÇÃO</Text>
               <View style={styles.descriptionBox}>
                 <Text style={styles.descriptionText}>
                   Este chamado consta como CONCLUÍDO no sistema.
                   Verifique o histórico ou anexos para detalhes da execução.
                 </Text>
               </View>
             </>
           )}
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Documento gerado automaticamente pelo Sistema de Manutenção em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
        </Text>
        
      </Page>
    </Document>
  );
};
