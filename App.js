import React, { useState, useEffect, createContext, useContext } from 'react';
import { Text, View, StyleSheet, TextInput, ScrollView, TouchableOpacity, FlatList, Alert, Modal } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons'; 

const GajiContext = createContext();

// --- KONSTANTA ---
const DAFTAR_BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const TAHUN_SAAT_INI = new Date().getFullYear();
const DAFTAR_TAHUN = Array.from({length: 11}, (_, i) => (TAHUN_SAAT_INI - 5 + i).toString());

const RIWAYAT_CODING = [
  { ver: "v1.7", desc: "Update Potongan: Menambahkan item 'Terlambat' pada daftar potongan." },
  { ver: "v1.6", desc: "UI Enhancement: Integrasi Ionicons pada Bottom Tab Navigation." },
  { ver: "v1.5", desc: "Perbaikan Scroll & List Lengkap Riwayat Coding di Pengaturan." },
  { ver: "v1.4", desc: "Visual Fix: Tombol 'Selesai' Periode diperjelas." },
  { ver: "v1.3", desc: "Audit Mode: Fitur selisih per item dibanding bulan sebelumnya." }
];

const formatRibuan = (angka) => {
  if (!angka && angka !== 0) return '0';
  const bersih = Math.abs(angka).toString().replace(/\D/g, '');
  const hasil = bersih.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return angka < 0 ? `-${hasil}` : hasil;
};

const unformatRibuan = (teks) => {
  if (!teks) return 0;
  const num = Number(teks.replace(/\./g, ''));
  return isNaN(num) ? 0 : num;
};

const InputGaji = ({ label, value, onChange }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.miniLabel}>{label}</Text>
    <TextInput 
      style={styles.input} 
      placeholder="0" 
      keyboardType="numeric" 
      value={formatRibuan(value)}
      onChangeText={(val) => onChange(unformatRibuan(val))}
    />
  </View>
);

// --- TAB 1: INPUT SLIP ---
function SlipGajiScreen() {
  const { simpanDataGaji } = useContext(GajiContext);
  const [bulan, setBulan] = useState(DAFTAR_BULAN[new Date().getMonth()]);
  const [tahun, setTahun] = useState(TAHUN_SAAT_INI.toString());
  const [modalPeriode, setModalPeriode] = useState(false);

  const [pemasukan, setPemasukan] = useState({ pokok: 0, jabatan: 0, transport: 0, makan: 0, harian: 0, premi: 0, koreksi: 0 });
  // UPDATE V1.7: TAMBAH TERLAMBAT
  const [potongan, setPotongan] = useState({ cicilan: 0, ksp: 0, jamsostek: 0, bpjs: 0, sakit: 0, izin: 0, alpha: 0, cuti: 0, imt: 0, terlambat: 0 });

  const handleSimpan = async () => {
    const totalMasuk = Object.values(pemasukan).reduce((a, b) => a + b, 0);
    const totalPotong = Object.values(potongan).reduce((a, b) => a + b, 0);
    const dataBaru = { 
      id: Date.now().toString(), 
      periode: `${bulan} ${tahun}`, 
      total: totalMasuk - totalPotong,
      detailMasuk: pemasukan,
      detailPotong: potongan
    };
    await simpanDataGaji(dataBaru);
    Alert.alert("Sukses", `Data ${bulan} ${tahun} Tersimpan!`);
    setPemasukan({ pokok: 0, jabatan: 0, transport: 0, makan: 0, harian: 0, premi: 0, koreksi: 0 });
    setPotongan({ cicilan: 0, ksp: 0, jamsostek: 0, bpjs: 0, sakit: 0, izin: 0, alpha: 0, cuti: 0, imt: 0, terlambat: 0 });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Input Slip Gaji</Text>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Periode</Text>
        <TouchableOpacity style={styles.pickerTrigger} onPress={() => setModalPeriode(true)}>
          <Text style={{fontSize: 16, fontWeight: 'bold'}}>{bulan} {tahun}</Text>
          <Ionicons name="calendar-outline" size={20} color="#3498db" />
        </TouchableOpacity>
      </View>
      <View style={[styles.section, { borderColor: '#27ae60' }]}>
        <Text style={[styles.sectionTitle, { color: '#27ae60' }]}>2. Pemasukan</Text>
        {Object.keys(pemasukan).map(key => (
          <InputGaji key={key} label={key.toUpperCase()} value={pemasukan[key]} onChange={(v) => setPemasukan({...pemasukan, [key]: v})} />
        ))}
      </View>
      <View style={[styles.section, { borderColor: '#e74c3c' }]}>
        <Text style={[styles.sectionTitle, { color: '#e74c3c' }]}>3. Potongan</Text>
        {Object.keys(potongan).map(key => (
          <InputGaji key={key} label={key.toUpperCase()} value={potongan[key]} onChange={(v) => setPotongan({...potongan, [key]: v})} />
        ))}
      </View>
      <TouchableOpacity style={styles.btnSimpan} onPress={handleSimpan}><Text style={styles.btnText}>SIMPAN DATA</Text></TouchableOpacity>
      
      <Modal visible={modalPeriode} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Pilih Periode</Text>
            <View style={styles.row}>
              <ScrollView style={{height: 250}}>{DAFTAR_BULAN.map(b => (
                <TouchableOpacity key={b} onPress={() => setBulan(b)} style={[styles.itemPilih, bulan === b && styles.itemAktif]}>
                  <Text style={bulan === b ? {color:'#fff'} : {color: '#333'}}>{b}</Text>
                </TouchableOpacity>
              ))}</ScrollView>
              <ScrollView style={{height: 250}}>{DAFTAR_TAHUN.map(t => (
                <TouchableOpacity key={t} onPress={() => setTahun(t)} style={[styles.itemPilih, tahun === t && styles.itemAktif]}>
                  <Text style={tahun === t ? {color:'#fff'} : {color: '#333'}}>{t}</Text>
                </TouchableOpacity>
              ))}</ScrollView>
            </View>
            <TouchableOpacity style={[styles.btnTutup, {backgroundColor: '#27ae60', marginTop: 20}]} onPress={() => setModalPeriode(false)}>
              <Text style={{color:'#fff', fontWeight:'bold'}}>SELESAI</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <View style={{height: 50}} />
    </ScrollView>
  );
}

// --- TAB 2: RANGKUMAN ---
function RangkumanScreen() {
  const { listGaji, editDataGaji } = useContext(GajiContext);
  const [selected, setSelected] = useState(null);
  const [prevData, setPrevData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editMasuk, setEditMasuk] = useState({});
  const [editPotong, setEditPotong] = useState({});

  const handleOpenDetail = (item, index) => { setSelected(item); setPrevData(listGaji[index + 1] || null); };
  const startEdit = () => { setEditMasuk(selected.detailMasuk); setEditPotong(selected.detailPotong); setIsEditing(true); };

  const saveEdit = async () => {
    const totalMasuk = Object.values(editMasuk).reduce((a, b) => a + b, 0);
    const totalPotong = Object.values(editPotong).reduce((a, b) => a + b, 0);
    const updated = { ...selected, total: totalMasuk - totalPotong, detailMasuk: editMasuk, detailPotong: editPotong };
    await editDataGaji(updated); setSelected(updated); setIsEditing(false); Alert.alert("Berhasil", "Data diperbarui!");
  };

  const renderDetailItem = (label, currentVal, prevVal, isPotongan = false) => {
    const diff = currentVal - (prevVal || 0);
    const colorDiff = diff > 0 ? (isPotongan ? '#e74c3c' : '#27ae60') : (isPotongan ? '#27ae60' : '#e74c3c');
    if (currentVal === 0 && (!prevVal || prevVal === 0)) return null;
    return (
      <View key={label} style={styles.detailRow}>
        <View style={{flex: 1}}><Text style={styles.capitalize}>{label}</Text></View>
        <View style={{alignItems: 'flex-end'}}>
          <Text style={{fontWeight: '500'}}>Rp {formatRibuan(currentVal)}</Text>
          {prevData && <Text style={{fontSize: 10, color: diff === 0 ? '#95a5a6' : colorDiff}}>{diff > 0 ? '▲' : diff < 0 ? '▼' : '='} {formatRibuan(diff)}</Text>}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList 
        data={listGaji} 
        keyExtractor={i => i.id} 
        renderItem={({item, index}) => {
          const selisih = item.total - (listGaji[index + 1]?.total || 0);
          return (
            <TouchableOpacity style={styles.cardRangkuman} onPress={() => handleOpenDetail(item, index)}>
              <View><Text style={styles.txtPeriode}>{item.periode}</Text><Text style={styles.txtTotal}>Rp {formatRibuan(item.total)}</Text></View>
              <View style={{flexDirection:'row', alignItems:'center'}}>
                <Ionicons name={selisih >= 0 ? "trending-up" : "trending-down"} size={16} color={selisih >= 0 ? '#27ae60' : '#e74c3c'} style={{marginRight:5}} />
                <Text style={{ color: selisih >= 0 ? '#27ae60' : '#e74c3c', fontWeight: 'bold' }}>{formatRibuan(Math.abs(selisih))}</Text>
              </View>
            </TouchableOpacity>
          );
        }} 
        ListEmptyComponent={<Text style={{textAlign:'center', marginTop:20}}>Belum ada data gaji.</Text>} 
      />
      <Modal visible={!!selected} transparent animationType="slide">
        <View style={styles.modalOverlay}><View style={[styles.modalContent, {maxHeight: '90%'}]}>
          <Text style={styles.modalTitle}>{isEditing ? 'Edit' : 'Rincian'} {selected?.periode}</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {isEditing ? (
              <>
                <Text style={styles.detailHeader}>PENMASUKAN</Text>
                {Object.keys(editMasuk).map(k => <InputGaji key={k} label={k.toUpperCase()} value={editMasuk[k]} onChange={v => setEditMasuk({...editMasuk, [k]:v})} />)}
                <Text style={[styles.detailHeader, {color:'#e74c3c', marginTop:10}]}>POTONGAN</Text>
                {Object.keys(editPotong).map(k => <InputGaji key={k} label={k.toUpperCase()} value={editPotong[k]} onChange={v => setEditPotong({...editPotong, [k]:v})} />)}
              </>
            ) : (
              <>
                <Text style={styles.detailHeader}>PENMASUKAN</Text>
                {selected && Object.keys(selected.detailMasuk).map(k => renderDetailItem(k, selected.detailMasuk[k], prevData?.detailMasuk?.[k]))}
                <Text style={[styles.detailHeader, {color:'#e74c3c', marginTop:15}]}>POTONGAN</Text>
                {selected && Object.keys(selected.detailPotong).map(k => renderDetailItem(k, selected.detailPotong[k], prevData?.detailPotong?.[k], true))}
                <View style={styles.totalDetailContainer}>
                  <Text style={styles.totalDetailText}>GAJI BERSIH</Text>
                  <View style={{alignItems:'flex-end'}}>
                    <Text style={styles.totalDetailValue}>Rp {formatRibuan(selected?.total)}</Text>
                    {prevData && <Text style={{fontSize:12, color: (selected.total - prevData.total) >= 0 ? '#27ae60' : '#e74c3c'}}>Selisih: {formatRibuan(selected.total - prevData.total)}</Text>}
                  </View>
                </View>
              </>
            )}
          </ScrollView>
          <View style={{flexDirection: 'row', justifyContent:'space-between', marginTop: 15}}>
            <TouchableOpacity style={[styles.btnTutup, {flex:1, marginRight:5, backgroundColor:'#95a5a6'}]} onPress={() => {setSelected(null); setIsEditing(false); setPrevData(null);}}><Text style={{color:'#fff'}}>TUTUP</Text></TouchableOpacity>
            {isEditing ? (
              <TouchableOpacity style={[styles.btnTutup, {flex:1, marginLeft:5, backgroundColor:'#27ae60'}]} onPress={saveEdit}><Text style={{color:'#fff'}}>SIMPAN</Text></TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.btnTutup, {flex:1, marginLeft:5, backgroundColor:'#3498db'}]} onPress={startEdit}><Text style={{color:'#fff'}}>EDIT</Text></TouchableOpacity>
            )}
          </View>
        </View></View>
      </Modal>
    </View>
  );
}

// --- TAB 3: PENGATURAN ---
function PengaturanScreen() {
  const { hapusSemua } = useContext(GajiContext);
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Pengaturan</Text>
      <View style={[styles.section, {flex: 1}]}>
        <Text style={styles.sectionTitle}>🚀 Riwayat Coding</Text>
        <ScrollView style={{marginTop: 5}}>
          {RIWAYAT_CODING.map((item, index) => (
            <View key={index} style={styles.changelogItem}>
              <View style={styles.versionBadge}><Text style={styles.versionText}>{item.ver}</Text></View>
              <Text style={styles.descText}>{item.desc}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
      <View style={[styles.section, {marginTop: 10}]}>
        <Text style={styles.sectionTitle}>⚠️ Zona Berbahaya</Text>
        <TouchableOpacity style={[styles.btnSimpan, {backgroundColor:'#e74c3c'}]} onPress={hapusSemua}>
          <Ionicons name="trash-outline" size={20} color="#fff" style={{marginBottom:5}} />
          <Text style={styles.btnText}>HAPUS SELURUH RIWAYAT GAJI</Text>
        </TouchableOpacity>
      </View>
      <Text style={{textAlign: 'center', color: '#bdc3c7', fontSize: 11, marginVertical: 15}}>Aplikasi Slip Gaji Pro v1.7</Text>
    </View>
  );
}

// --- APP CORE ---
const Tab = createBottomTabNavigator();

export default function App() {
  const [listGaji, setListGaji] = useState([]);
  useEffect(() => { (async () => {
    const saved = await AsyncStorage.getItem('@gaji_master_db_v4');
    if (saved) setListGaji(JSON.parse(saved));
  })() }, []);

  const simpanDataGaji = async (data) => {
    const newList = [data, ...listGaji]; setListGaji(newList);
    await AsyncStorage.setItem('@gaji_master_db_v4', JSON.stringify(newList));
  };

  const editDataGaji = async (updated) => {
    const newList = listGaji.map(i => i.id === updated.id ? updated : i); setListGaji(newList);
    await AsyncStorage.setItem('@gaji_master_db_v4', JSON.stringify(newList));
  };

  const hapusSemua = () => { Alert.alert("Hapus", "Hapus semua data?", [{text:"Batal"}, {text:"Ya", onPress: async () => { setListGaji([]); await AsyncStorage.removeItem('@gaji_master_db_v4'); }}]) };

  return (
    <GajiContext.Provider value={{ listGaji, simpanDataGaji, editDataGaji, hapusSemua }}>
      <NavigationContainer>
        <Tab.Navigator 
          screenOptions={({ route }) => ({
            headerStyle:{backgroundColor:'#3498db'}, 
            headerTintColor:'#fff',
            tabBarActiveTintColor: '#3498db',
            tabBarInactiveTintColor: 'gray',
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;
              if (route.name === 'Input') iconName = focused ? 'add-circle' : 'add-circle-outline';
              else if (route.name === 'Rangkuman') iconName = focused ? 'stats-chart' : 'stats-chart-outline';
              else if (route.name === 'Pengaturan') iconName = focused ? 'settings' : 'settings-outline';
              return <Ionicons name={iconName} size={size} color={color} />;
            },
          })}
        >
          <Tab.Screen name="Input" component={SlipGajiScreen} />
          <Tab.Screen name="Rangkuman" component={RangkumanScreen} />
          <Tab.Screen name="Pengaturan" component={PengaturanScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </GajiContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7f6', padding: 15 },
  header: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  section: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#ddd' },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 10, color: '#2c3e50' },
  inputGroup: { marginBottom: 10 },
  miniLabel: { fontSize: 11, color: '#7f8c8d' },
  input: { borderBottomWidth: 1, borderColor: '#ccc', paddingVertical: 2, fontSize: 15 },
  btnSimpan: { backgroundColor: '#27ae60', padding: 15, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  pickerTrigger: { flexDirection: 'row', justifyContent: 'space-between', alignItems:'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-around' },
  itemPilih: { padding: 10, borderRadius: 8, marginVertical: 2 },
  itemAktif: { backgroundColor: '#3498db' },
  btnTutup: { padding: 12, borderRadius: 10, alignItems: 'center' },
  cardRangkuman: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2 },
  txtPeriode: { fontSize: 12, color: '#7f8c8d' },
  txtTotal: { fontSize: 16, fontWeight: 'bold' },
  detailHeader: { fontSize: 13, fontWeight: 'bold', color: '#27ae60', borderBottomWidth: 1, borderColor: '#eee', paddingBottom: 5, marginBottom: 5 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 },
  capitalize: { textTransform: 'capitalize', color: '#555', fontSize: 13 },
  totalDetailContainer: { borderTopWidth: 2, borderColor: '#3498db', marginTop: 10, paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between' },
  totalDetailText: { fontWeight: 'bold' },
  totalDetailValue: { fontWeight: 'bold', color: '#3498db', fontSize: 16 },
  changelogItem: { borderLeftWidth: 3, borderLeftColor: '#3498db', paddingLeft: 10, marginBottom: 15 },
  versionBadge: { backgroundColor: '#ebf5fb', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 5, alignSelf: 'flex-start', marginBottom: 3 },
  versionText: { fontSize: 12, fontWeight: 'bold', color: '#3498db' },
  descText: { fontSize: 13, color: '#555' }
});