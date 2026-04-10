import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

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
    padding: 0,
  },
  header: {
    backgroundColor: '#1E293B',
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
    fontWeight: 'bold',
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 4,
  },
  brandSubtitle: {
    fontSize: 9,
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginBottom: 5,
  },
  label: {
    fontSize: 8,
    color: '#94A3B8',
    marginBottom: 2,
    textAlign: 'right',
  },
  value: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  container: {
    padding: 30,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.gray100,
    padding: 15,
    borderRadius: 6,
    marginBottom: 20,
    gap: 20,
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 8,
    color: colors.gray500,
    marginBottom: 3,
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  infoValue: {
    fontSize: 11,
    color: colors.gray800,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 14,
    color: colors.marinho,
    fontWeight: 'bold',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    paddingBottom: 5,
  },
  // Table
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.gray100,
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  th1: { flex: 4, fontSize: 9, fontWeight: 'bold', color: colors.gray800 },
  th2: { flex: 1, fontSize: 9, fontWeight: 'bold', color: colors.gray800, textAlign: 'center' },
  th3: { flex: 3, fontSize: 9, fontWeight: 'bold', color: colors.gray800 },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  td1: { flex: 4, fontSize: 9, color: colors.gray800, paddingRight: 5 },
  td2: { flex: 1, fontSize: 9, fontWeight: 'bold', textAlign: 'center' },
  td3: { flex: 3, fontSize: 9, color: colors.gray500, fontStyle: 'italic', paddingLeft: 5 },
  successText: { color: colors.success },
  errorText: { color: colors.error },
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

type ChecklistPdfProps = {
  inspection: any;
  template: any;
  results: any[];
  userProfile?: { name: string };
};

export const ChecklistPdfDocument = ({ inspection, template, results, userProfile }: ChecklistPdfProps) => {
  const completedDate = new Date(inspection.completed_at);
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR') + ' às ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };
  
  // Group results by area
  const areasMap: Record<string, any[]> = {};
  results.forEach(r => {
      const area = r.checklist_items?.area || 'Geral';
      if (!areasMap[area]) areasMap[area] = [];
      areasMap[area].push(r);
  });
  const areas = Object.keys(areasMap);

  return (
    <Document 
      title={`Vistoria - ${template?.name || 'Local'}`}
      author="Ancoradouro da Ponta"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.brandName}>ANCORADOURO DA PONTA</Text>
            <Text style={styles.brandSubtitle}>Relatório Oficial de Vistoria / Checklist</Text>
          </View>
          <View style={styles.headerRight}>
             <View style={styles.tag}>
                <Text style={styles.value}>VISTORIA</Text>
             </View>
             <Text style={styles.label}>{inspection.id?.substring(0,8).toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.container}>
            <View style={styles.infoBox}>
               <View style={styles.infoCol}>
                   <Text style={styles.infoLabel}>MODELO / LOCAL</Text>
                   <Text style={styles.infoValue}>{template?.name || 'N/A'}</Text>
               </View>
               <View style={styles.infoCol}>
                   <Text style={styles.infoLabel}>RESPONSÁVEL</Text>
                   <Text style={styles.infoValue}>{userProfile?.name || 'Usuário Sistema'}</Text>
               </View>
               <View style={styles.infoCol}>
                   <Text style={styles.infoLabel}>DATA / HORA</Text>
                   <Text style={styles.infoValue}>{formatDate(completedDate)}</Text>
               </View>
            </View>

            {areas.map(area => (
                <View key={area} style={{ marginBottom: 15 }} wrap={false}>
                    <Text style={styles.title}>{area}</Text>
                    <View style={styles.table}>
                        <View style={styles.tableHeader}>
                            <Text style={styles.th1}>Item Verificado</Text>
                            <Text style={styles.th2}>Status</Text>
                            <Text style={styles.th3}>Observação</Text>
                        </View>
                        {areasMap[area].map((r: any, idx) => (
                            <View style={styles.tableRow} key={idx}>
                                <Text style={styles.td1}>{r.checklist_items?.description}</Text>
                                <Text style={[styles.td2, r.status === 'ok' ? styles.successText : styles.errorText]}>
                                    {r.status === 'ok' ? 'Conforme' : 'Problema'}
                                </Text>
                                <Text style={styles.td3}>{r.observation || '-'}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            ))}
            
            <View style={{ marginTop: 20 }}>
                <Text style={{ fontSize: 8, color: colors.gray500, fontStyle: 'italic' }}>
                   * Os problemas identificados geram automatiamente Ordens de Serviço (OS) no módulo de manutenção.
                </Text>
            </View>
        </View>

        <View style={styles.footer} fixed>
           <Text style={styles.footerText}>Gerado em {new Date().toLocaleDateString('pt-BR')}</Text>
           <Text style={styles.footerText}>Relatório Oficial - Documento Interno</Text>
        </View>
      </Page>
    </Document>
  );
};
