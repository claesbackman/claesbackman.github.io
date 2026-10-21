* 00_programs.do
* Helper programs shared by the build and analysis do-files. Run from the project root.

capture program drop import_dst
program define import_dst
    * Import a StatBank table saved by 01_download_dst.py. Columns are read as strings
    * and INDHOLD becomes the numeric variable value (suppressed cells, "..", become missing).
    args table
    import delimited using "Data/raw/dst/`table'.csv", delimiter(";") varnames(1) ///
        stringcols(_all) encoding("utf-8") clear
    destring indhold, generate(value) force
    drop indhold
end

capture program drop gen_kom
program define gen_kom
    * Numeric municipality code from a DST area variable. Areas that are not one of the
    * 98 municipalities are dropped: All Denmark (000), regions (081-085), provinces
    * (01-11), Christiansø (411, administered by the state) and Outside Denmark (950).
    args areavar
    keep if strlen(`areavar') == 3 & `areavar' != "000" & substr(`areavar', 1, 2) != "08"
    drop if inlist(`areavar', "411", "950")
    generate int kom = real(`areavar')
    drop `areavar'
end
