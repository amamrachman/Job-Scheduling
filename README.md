# Job-Scheduling

Membuat optimasi penjadwalan dengan menggunakan algoritma genetika sebagai penyempurna dari algoritma cds (champbell dudek smith)
1. membuat populasi awal dengan algoritma cds dengan menghasilkan 9 iterasi (karena mesin pekerjaan terdapat 10, maka iterasi sebanyak k=m-1. yaitu 9 iterasi)
2. memilih individu dengan fitness berupa makespan yang dihasilkan paling sedikit
3. disempurnakan oleh algoritma genetika melalui proses crossover dan mutasi
4. serta menggunakan looping disetiap generasi untuk menghasilkan solusi baru disetiap iterasinya
5. looping berhenti sampai fitness tersebut <= target makspan yang di inputkan
6. dan menghasilkan urutan pekerjaan dengan makspan terkecil
